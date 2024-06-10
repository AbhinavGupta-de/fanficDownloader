// need a function that takes two paramters, singl/multi/series and the url of the story and call the function based on that

import { fetchSingleChapter } from './fetchSingleChapter';
import { fetchMultiChapter } from './fetchWholeStory';

export async function fetchStory(type: string, url: string): Promise<void> {
	if (type === 'single') {
		await fetchSingleChapter(url);
	} else if (type === 'multi') {
		await fetchMultiChapter(url);
	} else {
		console.error('Invalid story type:', type);
	}
}
