import { fetchSeries } from './fetchSeries';
import { fetchSingleChapter } from './fetchSingleChapter';
import { fetchMultiChapter } from './fetchWholeStory';

export async function fetchStory(
	type: string,
	url: string,
	downloadType: string
): Promise<void> {
	if (type === 'single') {
		await fetchSingleChapter(url, downloadType);
	} else if (type === 'multi') {
		await fetchMultiChapter(url, downloadType);
	} else if (type === 'series') {
		await fetchSeries(url, downloadType);
	} else {
		console.error('Invalid story type:', type);
	}
}
