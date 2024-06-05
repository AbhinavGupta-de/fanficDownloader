import * as functions from 'firebase-functions';
import * as puppeteer from 'puppeteer';

async function getChapterContent(url: string): Promise<string> {
	const browser = await puppeteer.launch({
		args: ['--no-sandbox', '--disable-setuid-sandbox'],
	});
	const page = await browser.newPage();
	await page.goto(url, { waitUntil: 'networkidle2' });

	const chapterContent = await page.$eval('#chapters', (div) => div.innerHTML);

	await browser.close();
	return chapterContent;
}

export const downloadSingleChapter = functions.https.onRequest(
	async (req, res) => {
		try {
			const { url } = req.body;
			if (!url) {
				res.status(400).send('URL is required');
				return;
			}

			const chapterContent = await getChapterContent(url);
			const browser = await puppeteer.launch({
				args: ['--no-sandbox', '--disable-setuid-sandbox'],
			});
			const page = await browser.newPage();
			await page.setContent(chapterContent);
			const pdfBuffer = await page.pdf();
			await browser.close();

			res.set('Content-Type', 'application/pdf');
			res.send(pdfBuffer);
		} catch (error: unknown) {
			if (error instanceof Error) {
				res.status(500).send(error.toString());
			} else {
				res.status(500).send('An unknown error occurred');
			}
		}
	}
);
