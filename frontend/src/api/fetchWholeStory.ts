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

		const pdfBlob = new Blob([response.data], { type: 'application/pdf' });
		const pdfUrl = URL.createObjectURL(pdfBlob);

		chrome.downloads.download({
			url: pdfUrl,
			filename: 'multi_chapter.pdf',
		});

		URL.revokeObjectURL(pdfUrl);
	} catch (error) {
		console.error('Error fetching multi-chapter:', error);
		throw error;
	}
}
