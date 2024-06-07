chrome.runtime.onInstalled.addListener(() => {
	console.log('Background script installed');
});

chrome.action.onClicked.addListener((tab) => {
	console.log('Action clicked:', tab);
	if (tab && tab.id !== undefined) {
		console.log('Injecting content script into tab:', tab.id);
		chrome.scripting.executeScript(
			{
				target: { tabId: tab.id },
				files: ['content.js'],
			},
			(injectionResults) => {
				if (chrome.runtime.lastError) {
					console.error('Error injecting content script:', chrome.runtime.lastError);
				} else {
					console.log('Content script injected');
					if (
						injectionResults &&
						injectionResults[0] &&
						injectionResults[0].result
					) {
						console.log('Content script result:', injectionResults[0].result);
					}
				}
			}
		);
	} else {
		console.error('Tab ID is undefined or tab is not defined');
	}
});
