/**
 * Veracode Enhancement Suite
 * by Matt Runkle (mrunkle@veracode.com)
 *
 * https://github.com/runkalicious/platform-helper
 */

 // Prep VES Nav Bar Item
$(document).ready(function() {
    setupNavigationBar();
});

// Listen for extension user login (for API calls)
chrome.runtime.sendMessage({requestType: "pageAction"}, function(response) {
    // Check if user is already logged in
    chrome.runtime.sendMessage({requestType: "loggedin"}, function(response) {
        if (response.status) {
            enableNavOptions();
        }
    });
});
chrome.runtime.onMessage.addListener(
    // Register for notification if user logs in/out after setup
	function(request, sender, sendResponse) {
        switch (request.requestType) {
            case 'loggedin':
                enableNavOptions();
                break;
            
            case 'loggedout':
                disableNavOptions();
                break;
            
            case 'flawviewer':
                // We are viewing triage flaws
                enhanceFlawViewer();
                break;
        }
        
        sendResponse({});
    }
);

function setupNavigationBar() {
    $('ul.navbar-nav:first').append('<li id="VES_calendarList" class="dropdown"> \
        <a href="#" disabled class="dropdown-toggle">VES<span class="caret"></span></a> \
        <ul class="dropdown-menu"><li> \
        <a id="VES_calendarItem" href="javascript:void(0);">Show Scan Calendar</a> \
        </li></ul></li>');
}

function enableNavOptions() {
    $('#VES_calendarItem').click(function(e) {
        setupAndShowCalendar(e);
    });
}

function disableNavOptions() {
    $('#VES_calendarList a').off('click');
}

function setupAndShowCalendar(e) {
    chrome.runtime.sendMessage({requestType: "calendarEvents"}, function(response) {
        
        if (!response.status) {
            console.log("Error retrieving calendar events");
            return;
        }
        
        $('body').append('<div id="VES_calendar" class="reveal-modal"><a class="close-reveal-modal">&#215;</a></div>');
        $('#VES_calendar').fullCalendar({
            fixedWeekCount: false,
            height: 500,
            events: response.value
        });
        
        $(e.target).off('click');
        $(e.target).click(showCalendar);
        
        showCalendar(e);
    });
}

function showCalendar(e) {
    $('#VES_calendar').reveal({
        closeonbackgroundclick: true,
        dismissmodalclass: 'close-reveal-modal'
    });
}


function enhanceFlawViewer() {
    console.log("Enhancements enabled");
}
