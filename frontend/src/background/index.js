chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
	if (request.downloadType) {
		// Send a message to the content script
		chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
			chrome.tabs.sendMessage(
				tabs[0].id,
				{ downloadType: request.downloadType, url: request.url },
				function (response) {
					sendResponse({
						status: response.status,
						file: response.file,
						error: response.error,
					});
				}
			);
		});
		return true; // Enables asynchronous response
	}
});
