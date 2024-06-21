import axios from 'axios';

export async function fetchSingleChapter(
	url: string,
	downloadType: string
): Promise<void> {
	console.log('Downloading single chapter...');
	try {
		const response = await axios.post(
			'https://66614fabac01bd29afbd.appwrite.global/',
			{ url, type: downloadType },
			{ responseType: 'arraybuffer' }
		);

		console.log('got the download...');

		const pdfBlob = new Blob([response.data], { type: 'application/pdf' });
		const pdfUrl = URL.createObjectURL(pdfBlob);

		chrome.downloads.download({
			url: pdfUrl,
			filename: 'single_chapter.pdf',
		});

		URL.revokeObjectURL(pdfUrl);
	} catch (error) {
		console.error('Error fetching single chapter:', error);
		throw error;
	}
}
