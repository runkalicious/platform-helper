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
chrome.runtime.sendMessage({requestType: "pageAction"}, function(x) {
    // Check if user is already logged in
    chrome.runtime.sendMessage({requestType: "loggedin"}, function(response) {
        if (response.status && response.value) {
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
                checkForLoaded(FLAW_TABLE, enhanceFlawViewer);
                break;
                
            case 'reviewmodules':
                // We are viewing Review Modules
                checkForLoaded(MODULE_TABLE, showModuleSelectWarning);
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
        
        $('body').append('<div id="VES_calendar" class="reveal-modal">\
            <a class="close-reveal-modal">&#215;</a> \
            <div id="VES_calendar_key"> \
                <div class="swatch verablue"></div><p class="swatch_label">Static Scan</p> \
                <div class="swatch verapink"></div><p class="swatch_label">Dynamic Scan</p> \
                <div class="swatch veragreen"></div><p class="swatch_label">Manual Scan</p> \
            </div></div>');
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

/* ------------------------ */
/* Flaw Viewer Enhancements */

function checkForLoaded(element_id, func) {
   // This function will check, every tenth of a second, to see if 
   // our element is a part of the DOM tree - as soon as we know 
   // that it is, we execute the provided function.
   if($(element_id).length) {
      func();
   } else {
      setTimeout(function() { checkForLoaded(element_id, func); }, 100);
   }
}

FLAW_TABLE = '#appVerIssueListTable_static tbody:first';
function enhanceFlawViewer() {
    var desc_tr = $('tr')
        .filter(function() {
            return this.id.match(/d\d+_\w+/);
        });
    
    var description,
        regex = /(.+ call to )(\S+)(.+\. The \w+ argument to )(\S+)(.+ variable )(\S+)(\..+ earlier call to )(\S+)(\.)/,
        repl = '$1<span class="ves_code">$2</span>$3<span class="ves_code">$4</span>$5<span class="ves_code">$6</span>$7<span class="ves_code">$8</span>$9';
    $(desc_tr).each(function() {
        description = $(this)
            .find('span')
            .filter(function() {
                return this.id.match(/flawDescription\d+/);
            });
        
        var markedup = $(description).text().replace(regex, repl);
        $(description).html(markedup)
    });
}

/* --------------------------- */
/* Review Modules Enhancements */

MODULE_TABLE = '#moduleListTableDiv table:first';
function showModuleSelectWarning() {
    if ($(MODULE_TABLE).find('input[type="checkbox"]').length) {
        // Module selection page, display warning
        $(MODULE_TABLE).before('<p class="ves_message">Selecting third-party modules \
            will scan the entire code space, including sections unused by your program. \
            <a id="ves_learnmore" href="#">Learn more</a></p>');
        
        $('#ves_learnmore').click(function(e) {
            if (e && e.preventDefault) e.preventDefault();
            $('#scanSelThHelp-1').click();
        });
    }
}
