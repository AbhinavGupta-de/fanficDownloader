import { execSync } from 'child_process';
import puppeteer from 'puppeteer';
import Epub from 'epub-gen';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const readFile = promisify(fs.readFile);

let installed = false;

async function getChapterContent(url, log) {
	const browser = await puppeteer.launch({
		executablePath: '/usr/bin/chromium-browser',
		args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
	});
	const page = await browser.newPage();

	await page.setCacheEnabled(false);
	await page.goto(url, { waitUntil: 'networkidle2' });

	const chapterContent = await page.$eval('#workskin', (div) => div.innerHTML);
	await browser.close();
	return chapterContent;
}

export default async ({ req, res, log }) => {
	try {
		log('Function invoked');
		log(`Request object: ${req}`);

		const { url, type } = req.body;
		log(`Parsed URL: ${url}`);

		if (!url) {
			log('No URL provided');
			return res.json({ error: 'URL is required' }, 400);
		}

		if (!type) {
			log('No type provided');
			return res.json({ error: 'Type is required' }, 400);
		}

		// Install Chromium and dependencies if not installed
		if (!installed) {
			log('Installing Chromium and dependencies');
			execSync(
				'apk add --no-cache chromium nss freetype harfbuzz ca-certificates ttf-freefont'
			);
			log('Chromium and dependencies installed');
			installed = true;
		} else {
			log('Chromium already installed');
		}

		log(`Fetching content from URL: ${url}`);
		const chapterContent = await getChapterContent(url, log);
		log('Content fetched successfully');

		if (type === 'pdf') {
			const browser = await puppeteer.launch({
				executablePath: '/usr/bin/chromium-browser',
				args: [
					'--no-sandbox',
					'--disable-setuid-sandbox',
					'--disable-dev-shm-usage',
				],
			});
			const page = await browser.newPage();

			await page.setCacheEnabled(false);
			await page.setContent(chapterContent);
			log('Content set successfully');

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

			await browser.close();
			log('PDF generated successfully');

			return res.send(pdfBuffer, 200, { 'Content-Type': 'application/pdf' });
		} else if (type === 'epub') {
			const epubOptions = {
				title: 'Fanfic Story',
				author: 'Unknown',
				content: [
					{
						title: 'Story',
						data: chapterContent,
					},
				],
			};

			const outputPath = path.join('/tmp', 'story.epub');
			await new Epub(epubOptions, outputPath).promise;

			const epubBuffer = await readFile(outputPath);
			log('EPUB generated successfully');

			return res.send(epubBuffer, 200, { 'Content-Type': 'application/epub+zip' });
		} else {
			log('Unsupported file type requested');
			return res.json({ error: 'Unsupported file type requested' }, 400);
		}
	} catch (err) {
		log(`Error occurred: ${err}`);
		return res.json({ error: err.toString() }, 500);
	}
};
