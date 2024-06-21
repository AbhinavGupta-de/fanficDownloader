import axios from 'axios';

export async function fetchMultiChapter(
	url: string,
	downloadType: string
): Promise<void> {
	try {
		const response = await axios.post(
			'https://6661df0a82b533cdfb2e.appwrite.global/',
			{ url, type: downloadType },
			{ responseType: 'arraybuffer' }
		);

		let blob;
		let fileName;

		if (downloadType === 'pdf') {
			blob = new Blob([response.data], { type: 'application/pdf' });
			fileName = 'multi_chapter.pdf';
		} else if (downloadType === 'epub') {
			blob = new Blob([response.data], { type: 'application/epub+zip' });
			fileName = 'multi_chapter.epub';
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
		console.error('Error fetching multi-chapter:', error);
		throw error;
	}
}
