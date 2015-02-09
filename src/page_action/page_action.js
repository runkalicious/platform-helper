/**
 * Veracode Enhancement Suite
 * by Matt Runkle (mrunkle@veracode.com)
 *
 * https://github.com/runkalicious/platform-helper
 */

var LOGIN_FORM = '#login';
var LOGOUT_FORM = '#logout';

var ERROR_ID = '#message';
var NOTIFY_ID = '#notifcation';

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
            
            // TODO pull data
        }
        else {
            showNotification("Error on API user login!");
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
            showNotification("Error on API user logout!");
        }
    });
    
    return false;
}

function query(e) {
    if (e.preventDefault) e.preventDefault();
    
    chrome.runtime.sendMessage({requestType: "pullData"}, function(response) {
        
        if (response.status) {
            // Success
            showNotification("Success on data pull!");
        }
        else {
            showNotification("Error data pull!");
        }
    });
    
    return false;
}

function showNotification(message) {
    console.log(message);
    $(ERROR_ID).text(message);
    $(NOTIFY_ID).show();
}

function hideNotification() {
    $(NOTIFY_ID).hide();
}

// Register the form listener
document.addEventListener('DOMContentLoaded', function () {
    
    chrome.runtime.sendMessage({requestType: "localStorage", action: "hasItem", itemName: "apiuser"}, function(response) {
        
        if (response.value) {
            // API user already logged in.
            $(LOGOUT_FORM).show();
            $('#api_logout').click(logout);
            $('#query').click(query);
        }
        else {
            // No API user logged in
            $(LOGIN_FORM).show();
            $('#api_login').submit(login);
        }
        
    });
    
});
