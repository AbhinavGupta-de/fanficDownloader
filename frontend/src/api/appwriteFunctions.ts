import { downloadWithJobQueue, ProgressCallback } from './jobQueue';

type DownloadType = 'single-chapter' | 'multi-chapter' | 'series';

/**
 * Map UI type to API type
 */
function mapType(type: string): DownloadType {
	switch (type) {
		case 'single':
			return 'single-chapter';
		case 'multi':
			return 'multi-chapter';
		case 'series':
			return 'series';
		default:
			return 'single-chapter';
	}
}

/**
 * Download a story using the async job queue
 */
export async function fetchStory(
	type: string,
	url: string,
	downloadType: string,
	onProgress?: ProgressCallback
): Promise<void> {
	const apiType = mapType(type);
	const format = downloadType as 'pdf' | 'epub';

	console.log(`Starting ${apiType} download as ${format}...`);

	try {
		// Use job queue for all downloads (handles long-running tasks)
		const result = await downloadWithJobQueue(url, apiType, format, onProgress);

		// Create blob and trigger download
		const mimeType = format === 'pdf' ? 'application/pdf' : 'application/epub+zip';
		const blob = new Blob([result], { type: mimeType });
		const downloadUrl = URL.createObjectURL(blob);

		// Generate filename based on type
		const filename = `${type}_download.${format}`;

		chrome.downloads.download({
			url: downloadUrl,
			filename: filename,
		});

		URL.revokeObjectURL(downloadUrl);
		console.log('Download complete!');
	} catch (error) {
		console.error('Error fetching story:', error);
		throw error;
	}
}
