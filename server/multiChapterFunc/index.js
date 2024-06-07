import { execSync } from 'child_process';
import puppeteer from 'puppeteer';

let installed = false;

async function getHtmlContent(url, log) {
	const browser = await puppeteer.launch({
		executablePath: '/usr/bin/chromium-browser',
		args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
	});
	const page = await browser.newPage();

	await page.setCacheEnabled(false);
	await page.goto(url, { waitUntil: 'networkidle2' });
	const content = await page.$eval('#workskin', (div) => div.innerHTML);
	await browser.close();
	return content;
}

async function downloadStoryContent(url, log) {
	const browser = await puppeteer.launch({
		executablePath: '/usr/bin/chromium-browser',
		args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
	});
	const page = await browser.newPage();

	try {
		await page.setCacheEnabled(false);
		await page.goto(url, { waitUntil: 'networkidle2' });

		const entireWorkLink = await page.$('li.chapter.entire a');
		if (entireWorkLink) {
			const entireWorkUrl = await page.evaluate(
				(link) => link.getAttribute('href'),
				entireWorkLink
			);
			if (!entireWorkUrl) {
				throw new Error('Entire Work link does not have a valid URL');
			}
			await page.goto(`https://archiveofourown.org${entireWorkUrl}`, {
				waitUntil: 'networkidle2',
			});
		}

		const storyContent = await getHtmlContent(page.url(), log);
		await page.setContent(storyContent);

		const pdfBuffer = await page.pdf({
			format: 'A4',
			margin: {
				top: '20mm',
				bottom: '20mm',
				left: '20mm',
				right: '20mm',
			},
			displayHeaderFooter: true,
			headerTemplate:
				'<div style="font-size: 10px; text-align: center; width: 100%; display: flex;">Downloaded using fanfic downloader</div>',
			footerTemplate:
				'<div style="font-size: 10px; text-align: center;">Page <span class="pageNumber"></span> of <span class="totalPages"></span></div>',
		});

		return pdfBuffer;
	} catch (error) {
		throw new Error(`Failed to download story: ${error.message}`);
	} finally {
		await browser.close();
	}
}

export default async ({ req, res, log }) => {
	try {
		if (!installed) {
			execSync(
				'apk add --no-cache chromium nss freetype harfbuzz ca-certificates ttf-freefont'
			);
			installed = true;
		}

		const { url } = req.body;
		if (!url) {
			log('No URL provided');
			return res.json({ error: 'URL is required' }, 400);
		}

		log(`Fetching content from URL: ${url}`);
		const storyContent = await downloadStoryContent(url, log);
		log('Content fetched and PDF generated successfully');

		return res.send(storyContent, 200, { 'Content-Type': 'application/pdf' });
	} catch (error) {
		log(`Error occurred: ${error.message}`);
		return res.json({ error: error.toString() }, 500);
	}
};
