/**
 * Veracode Enhancement Suite
 * by Matt Runkle (mrunkle@veracode.com)
 *
 * https://github.com/runkalicious/platform-helper
 */

var LOGIN_FORM = '#login';
var LOGOUT_FORM = '#logout';

var PULLED_DATE = '#lastpulled';

var ERROR_MSG = '#message';
var NOTIFY_PANE = '#notification';

function login(e) {
    if (e.preventDefault) e.preventDefault();
    
    var username = $('#username').val();
    var password = $('#password').val();
    
    /* TODO sanitize input */
    
    chrome.runtime.sendMessage({requestType: "login", value: [username, password]}, function(response) {
        
        if (response.status) {
            // Success
            $(LOGIN_FORM).toggle();
            $(LOGOUT_FORM).toggle();
            $('#api_logout').click(logout);
            
            refreshData();
        }
        else {
            showNotification("Error on API user login!", true);
        }
    });
    
    return false;
}

function logout(e) {
    if (e.preventDefault) e.preventDefault();
    
    chrome.runtime.sendMessage({requestType: "logout"}, function(response) {
        
        if (response.status) {
            // Success
            $(LOGOUT_FORM).toggle();
            $('#api_logout').off('click');
            $(LOGIN_FORM).toggle();
        }
        else {
            showNotification("Error on API user logout!", true);
        }
    });
    
    return false;
}

function refreshData(e) {
    if (e && e.preventDefault) e.preventDefault();
    
    chrome.runtime.sendMessage({requestType: "pullData"}, function(response) {
        
        if (response.status) {
            // Success
            showNotification("Application data retrieved successfully", false);
            $(PULLED_DATE).text(response.value);
        }
        else {
            showNotification("Error retrieving application data", true);
        }
    });
    
    return false;
}

function showNotification(message, isError) {
    console.log(message);
    $(ERROR_MSG).text(message);
    if (isError) {
        $(ERROR_MSG).removeClass('error');
    }
    else {
        $(ERROR_MSG).addClass('error');
    }
    $(NOTIFY_PANE).show();
    
    setTimeout(hideNotification, 10000); // 10 sec
}

function hideNotification() {
    $(NOTIFY_PANE).hide();
}

// Register the form listener
document.addEventListener('DOMContentLoaded', function () {
    
    chrome.runtime.sendMessage({requestType: "localStorage", action: "getItem", itemName: "data_date"}, function(response) {
        
        if (response.value) {
            // API user already logged in.
            $(PULLED_DATE).text(response.value['data_date']);
            $(LOGOUT_FORM).show();
            $('#api_logout').click(logout);
            $('#query').click(refreshData);
        }
        else {
            // No API user logged in
            $(LOGIN_FORM).show();
            $('#api_login').submit(login);
        }
        
    });
    
});
