/**
 * Veracode Enhancement Suite
 * by Matt Runkle (mrunkle@veracode.com)
 *
 * https://github.com/runkalicious/platform-helper
 */

// Helper methods
if (typeof String.prototype.startsWith != 'function') {
	String.prototype.startsWith = function(str) {
		return this.slice(0, str.length) == str;
	};
}

if (!chrome.runtime) {
    // Chrome 20-21
    chrome.runtime = chrome.extension;
}
else if (!chrome.runtime.onMessage) {
    // Chrome 22-25
    chrome.runtime.onMessage = chrome.extension.onMessage;
    chrome.runtime.sendMessage = chrome.extension.sendMessage;
    chrome.runtime.onConnect = chrome.extension.onConnect;
    chrome.runtime.connect = chrome.extension.connect;
}

// Check whether new version is installed
chrome.runtime.onInstalled.addListener(function(details) {
    if (details.reason == "install") {
        // Set default values
        chrome.storage.local.set({'enhanceFlawViewer': true});
    }
    else if (details.reason == "update") {
        var thisVersion = chrome.runtime.getManifest().version;
        // do nothing for now
    }
});

//chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    
    if (changeInfo.status != "complete" || 
        !tab.url.startsWith("https://analysiscenter.veracode.com/auth/")) {
        return;
    }
    
    if (tab.url.search(/#ReviewResults/) > 0) {
        chrome.tabs.sendMessage(tab.id, {requestType: 'flawviewer'});
    }
    else if (tab.url.search(/#AnalyzeAppModuleList/) > 0) {
        chrome.tabs.sendMessage(tab.id, {requestType: 'reviewmodules'});
    }
    
});

// Setup messaging construct
chrome.runtime.onMessage.addListener(
	function(request, sender, sendResponse) {
        switch (request.requestType) {
			case 'ping':
                sendResponse({status: true, value: 'pong'});
                break;
            
            case 'login':
                var credentials = {'apiuser': request.value[0], 'apipass': request.value[1]};
                chrome.storage.local.set(credentials, function() {
                    sendResponse({status: (chrome.runtime.lastError ? false : true), value: null});
                });
                // Notify page
                chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                    chrome.tabs.sendMessage(tabs[0].id, {requestType: 'loggedin'});
                });
                break;
            
            case 'loggedin':
                chrome.storage.local.get('apiuser', function(items) {
                    sendResponse({status: true, value: !$.isEmptyObject(items)});
                });
                break;
            
            case 'logout':
                chrome.storage.local.remove(["apiuser", "apipass", "data_date"], function() {
                    sendResponse({status: (chrome.runtime.lastError ? false : true), value: null});
                });
                // Notify page
                chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                    chrome.tabs.sendMessage(tabs[0].id, {requestType: 'loggedout'});
                });
                break;
            
            case 'localStorage':
                switch (request.action) {
                    case 'hasItem':
                        chrome.storage.local.get(request.itemName, function(items) {
                            sendResponse({status: true, value: !$.isEmptyObject(items)});
                        });
						break;
                    
                    case 'deleteItem':
                        chrome.storage.local.remove(request.itemName, function() {
                            sendResponse({status: (chrome.runtime.lastError ? false : true), value: null});
                        });
						break;
                    
                    case 'getItem':
                        chrome.storage.local.get(request.itemName, function(items) {
                            if ($.isEmptyObject(items)) {
                                sendResponse({status: true, value: null});
                            } 
                            else {
                                sendResponse({status: true, value: items});
                            }
                        });
						break;
                    
                    case 'setItem':
                        chrome.storage.local.set(request.itemValue, function() {
                            sendResponse({status: (chrome.runtime.lastError ? false : true), value: null});
                        });
						break;
                }
                break;
                
            case 'pageAction':
				switch (request.action) {
					case 'show':
						// we intentionally fall through after this to stateChange
                        chrome.pageAction.show(sender.tab.id);
                        sendResponse({status: true, value: null});
                        break;
					
                    case 'hide':
						chrome.pageAction.hide(sender.tab.id);
                        sendResponse({status: true, value: null});
						break;
                        
                    default:
                        // Autoselect - most common
                        var currentURL = sender.tab.url
                        if (currentURL.search("helpcenter") > 0) {
                            chrome.pageAction.hide(sender.tab.id);
                        }
                        else {
                            chrome.pageAction.show(sender.tab.id);
                        }
                        sendResponse({status: true, value: null});
				}
				break;
            
            case 'pullData':
                getApplicationStatuses(sendResponse);
                break;
            
            case 'calendarEvents':
                getCalendarEvents(sendResponse);
                break;
            
			default:
				sendResponse({status: false, value:'unrecognized request type'});
				break;
        }
        
        return true;
    }
);

// http://www.webdevelopersnotes.com/tips/html/formatting_time_using_javascript.php3
var m_names = new Array("January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December");
function getTimestamp() {
    var d = new Date();
    var curr_date = d.getDate();
    var curr_month = d.getMonth();
    var curr_year = d.getFullYear();
    var curr_hour = d.getHours();
    var curr_min = d.getMinutes();
    
    var a_p = "";
    if (curr_hour < 12) {
        a_p = "AM";
    }
    else {
        a_p = "PM";
    }
    if (curr_hour == 0) {
        curr_hour = 12;
    }
    if (curr_hour > 12) {
        curr_hour = curr_hour - 12;
    }
    
    curr_min = curr_min + "";
    if (curr_min.length == 1) {
        curr_min = "0" + curr_min;
    }
    
    return m_names[curr_month] + " " + curr_date + ", " + curr_year + 
        " " + curr_hour + ":" + curr_min + " " + a_p;
}

function getApplicationStatuses(sendResponse) {
    chrome.storage.local.get(['apiuser', 'apipass'], function(items) {
        $.ajax({
            type: "POST",
            url: "https://analysiscenter.veracode.com/api/4.0/getappbuilds.do",
            dataType: 'xml',
            headers: {
                "Authorization": "Basic " + btoa(items['apiuser'] + ":" + items['apipass'])
            },
            success: function(data) {
                var applications = [];
                var app, scan, results, i = 0;
                
                // Save the relevant data pieces to the store
                $xml = $(data);
                $xml.find('application').each(function() {
                    var j = 0;
                    app = {'app_name': $(this).attr('app_name'), 'scans': []}
                    
                    $(this).find('build').each(function() {
                        results = $(this).find('analysis_unit');
                        scan = {
                            'scan_name': $(this).attr('version'),
                            'results': $(this).attr('results_ready'),
                            'compliance': $(this).attr('policy_compliance_status'),
                            'type': $(results).attr('analysis_type'),
                            'date': $(results).attr('published_date'),
                            'status': $(results).attr('status')
                        }
                        app['scans'][j++] = scan;
                    });
                    
                    applications[i++] = app;
                });
                
                var timestamp = getTimestamp();
                chrome.storage.local.set({'data_date': timestamp, 'data': applications}, function() {
                    sendResponse({status: (chrome.runtime.lastError ? false : true), value: timestamp});
                });
            },
            fail: function(data) {
                sendResponse({status: false, value: null});
            }
        });
    });
}

function getCalendarEvents(sendResponse) {
    chrome.storage.local.get('data', function(items) {
        var events = [],
            title,
            i = 0;
        $(items['data']).each(function() {
            title = this.app_name;
            
            $(this.scans).each(function() {
                events[i++] = {'title': title, allDay: true, start: this.date};
            });
        });
        
        sendResponse({status: true, value: events});
    });
}
