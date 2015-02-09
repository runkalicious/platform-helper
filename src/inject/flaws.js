/**
 * Veracode Enhancement Suite
 * by Matt Runkle (mrunkle@veracode.com)
 *
 * https://github.com/runkalicious/platform-helper
 */

chrome.runtime.sendMessage({requestType: "localStorage", action: "hasItem", 
    itemName: "enhanceFlawViewer"}, function(response) {
    
    if (response.status && response.value) {
        // Inject flaw viewer enhancements
        enableEnhancements();
    }
    
});

function enableEnhancements() {
    console.log("Enhancements enabled");
}
