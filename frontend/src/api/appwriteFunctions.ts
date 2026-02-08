import { downloadWithJobQueue, ProgressCallback } from './jobQueue';
import type { StoryMetadata } from './jobQueue';

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
 * Sanitize a string for use as a filename
 */
function sanitizeFilename(name: string): string {
	return name.replace(/[/\\?%*:|"<>]/g, '').trim();
}

/**
 * Build a filename from metadata and download type
 */
function buildFilename(type: string, format: string, metadata?: StoryMetadata): string {
	if (!metadata?.title) {
		return `${type}_download.${format}`;
	}

	const title = sanitizeFilename(metadata.title);

	switch (type) {
		case 'single': {
			// Extract chapter number from URL if available
			const chapterMatch = metadata.url?.match(/\/chapters\/(\d+)/);
			if (chapterMatch) {
				return `${title} - Chapter ${chapterMatch[1]}.${format}`;
			}
			return `${title} - Single Chapter.${format}`;
		}
		case 'multi':
			return `${title}.${format}`;
		case 'series':
			return `${title} (Series).${format}`;
		default:
			return `${title}.${format}`;
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
		const { data, metadata } = await downloadWithJobQueue(url, apiType, format, onProgress);

		// Create blob and trigger download
		const mimeType = format === 'pdf' ? 'application/pdf' : 'application/epub+zip';
		const blob = new Blob([data], { type: mimeType });
		const downloadUrl = URL.createObjectURL(blob);

		// Generate filename from metadata
		const filename = buildFilename(type, format, metadata);

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
