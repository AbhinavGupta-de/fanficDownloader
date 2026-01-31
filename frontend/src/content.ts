console.log('Content script running');

function extractData() {
	const hostname = window.location.hostname;
	let storyName = '';
	let author = '';

	// AO3 selectors
	if (hostname.includes('archiveofourown.org')) {
		const storyNameElement = document.querySelector('.title.heading');
		const authorElement = document.querySelector('.byline.heading a[rel="author"]');
		storyName = storyNameElement?.textContent?.trim() || '';
		author = authorElement?.textContent?.trim() || '';
	}
	// FFN selectors
	else if (hostname.includes('fanfiction.net')) {
		const storyNameElement = document.querySelector('#profile_top b.xcontrast_txt');
		const authorElement = document.querySelector('#profile_top a.xcontrast_txt');
		storyName = storyNameElement?.textContent?.trim() || '';
		author = authorElement?.textContent?.trim() || '';
	}

	const data = {
		storyName,
		author,
		siteName: hostname.includes('archiveofourown') ? 'AO3' :
		          hostname.includes('fanfiction.net') ? 'FanFiction.Net' : hostname,
	};

	return data;
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
	if (message.action === 'extractData') {
		const data = extractData();
		sendResponse(data);
	}
});
