chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
	if (message.action === 'downloadFanfic') {
		const { url, filename, content } = message;
		chrome.downloads.download({
			url: url,
			filename: filename,
			saveAs: true,
		});
		sendResponse({ status: 'success' });
	}
});
