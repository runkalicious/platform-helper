/**
 * Veracode Enhancement Suite
 * by Matt Runkle (mrunkle@veracode.com)
 *
 * https://github.com/runkalicious/platform-helper
 */
 
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
                chrome.storage.local.remove(["apiuser", "apipass"], function() {
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
                            sendResponse({status: true, value: items});
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
                getApplicationStatuses();
                sendResponse({status: true, value: null});
                break;
            
			default:
				sendResponse({status: false, value:'unrecognized request type'});
				break;
        }
        
        return true;
    }
);

function getApplicationStatuses() {
    
    var apiuser, apipass;
    chrome.storage.local.get(['apiuser', 'apipass'], function(items) {
        apiuser = items['apiuser'];
        apipass = items['apipass'];
        
        $.ajax({
            type: "POST",
            url: "https://analysiscenter.veracode.com/api/4.0/getappbuilds.do",
            dataType: 'xml',
            headers: {
                "Authorization": "Basic " + btoa(apiuser + ":" + apipass)
            },
            success: function(data) {
                console.log("API hit");
                console.log(data);
            }
        });
    });
    
}