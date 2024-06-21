import axios from 'axios';

export async function fetchSingleChapter(
	url: string,
	downloadType: string
): Promise<void> {
	console.log('Downloading single chapter...');
	try {
		const response = await axios.post(
			'https://66707abeeafd1f8178e8.appwrite.global/',
			{ url, type: downloadType },
			{ responseType: 'arraybuffer' }
		);

		console.log('got the download...');

		let blob;
		let fileName;

		if (downloadType === 'pdf') {
			blob = new Blob([response.data], { type: 'application/pdf' });
			fileName = 'single_chapter.pdf';
		} else if (downloadType === 'epub') {
			blob = new Blob([response.data], { type: 'application/epub+zip' });
			fileName = 'single_chapter.epub';
		} else {
			throw new Error('Unsupported download type');
		}

		const downloadUrl = URL.createObjectURL(blob);

		chrome.downloads.download({
			url: downloadUrl,
			filename: fileName,
		});

		URL.revokeObjectURL(downloadUrl);
	} catch (error) {
		console.error('Error fetching single chapter:', error);
		throw error;
	}
}
