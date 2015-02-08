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
    
    chrome.runtime.sendMessage({requestType: "localStorage", operation: "setItems", 
        itemNames: ["apiuser", "apipass"], itemValues: [username, password] }, function(response) {
        
        if (response.result) {
            // Success
            $(LOGIN_FORM).toggle();
            $(LOGOUT_FORM).toggle();
            
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

    chrome.runtime.sendMessage({requestType: "localStorage", operation: "deleteItems", 
        itemNames: ["apiuser", "apipass"]}, function(response) {
        
        if (response.result) {
            // Success
            $(LOGOUT_FORM).toggle();
            $(LOGIN_FORM).toggle();
        }
        else {
            showNotification("Error on API user logout!");
        }
    });
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
    
    chrome.runtime.sendMessage({requestType: "localStorage", operation: "hasItem", itemName: "apiuser"}, function(response) {
        
        if (response.result) {
            // API user already logged in.
            $(LOGOUT_FORM).show();
        }
        else {
            // No API user logged in
            $(LOGIN_FORM).show();
        }
        
    });
    
});
