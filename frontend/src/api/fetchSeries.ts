import axios from 'axios';

export async function fetchSeries(
	url: string,
	downloadType: string
): Promise<void> {
	try {
		const response = await axios.post(
			'https://6671437b55829c7796ce.appwrite.global',
			{ url, type: downloadType },
			{ responseType: 'arraybuffer' }
		);

		let mimeType = '';
		let fileExtension = '';

		if (downloadType === 'pdf') {
			mimeType = 'application/pdf';
			fileExtension = 'pdf';
		} else if (downloadType === 'epub') {
			mimeType = 'application/epub+zip';
			fileExtension = 'epub';
		} else {
			throw new Error('Unsupported download type');
		}

		const blob = new Blob([response.data], { type: mimeType });
		const downloadUrl = URL.createObjectURL(blob);

		chrome.downloads.download({
			url: downloadUrl,
			filename: `series.${fileExtension}`,
		});

		URL.revokeObjectURL(downloadUrl);
	} catch (error) {
		console.error('Error fetching series:', error);
		throw error;
	}
}
