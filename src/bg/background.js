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
		
        console.log(request);
        
        switch (request.requestType) {
			case 'ping':
                sendResponse({status: true, value: 'pong'});
                break;
            
            case 'localStorage':
                switch (request.action) {
                    case 'hasItem':
                        chrome.storage.local.get(request.itemName, function(items) {
                            console.log(items);
                            console.log($.isEmptyObject(items));
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
				}
				break;
            
			default:
				sendResponse({status: false, value:'unrecognized request type'});
				break;
        }
        
        return true;
    }
);
