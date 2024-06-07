console.log('Content script running');

function extractData() {
	const storyNameElement = document.querySelector('.title.heading');
	const authorElement = document.querySelector('.byline.heading');

	if (!storyNameElement || !authorElement) {
		console.error('Could not find the necessary elements on the page.');
	}

	const data = {
		storyName: storyNameElement?.textContent || '',
		author: authorElement?.textContent || '',
		siteName: window.location.hostname,
	};
	return data;
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
	if (message.action === 'extractData') {
		const data = extractData();
		sendResponse(data);
	}
});
