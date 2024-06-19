import { execSync } from 'child_process';
import puppeteer from 'puppeteer';
import Epub from 'epub-gen';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const readFile = promisify(fs.readFile);

let installed = false;

async function launchBrowser() {
	return puppeteer.launch({
		executablePath: '/usr/bin/chromium-browser',
		args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
	});
}

async function navigateToPage(page, url) {
	await page.goto(url, { waitUntil: 'networkidle2' });
}

async function handleSingleChapterPage(page, url, log) {
	const storiesContent = [];
	await navigateToPage(page, url);

	const entireWorkLink = await page.$('li.chapter.entire a');
	if (entireWorkLink) {
		const entireWorkUrl = await page.evaluate(
			(link) => link.href,
			entireWorkLink
		);
		await navigateToPage(page, entireWorkUrl);
	}

	const storyContent = await page.$eval('#workskin', (div) => div.innerHTML);
	storiesContent.push(storyContent);
	const nextLink = await page.$('span.series a.next');
	if (nextLink) {
		const nextUrl = await page.evaluate((link) => link.href, nextLink);
		log(`Navigating to next story URL: ${nextUrl}`);
		storiesContent.push(handleSeriesPage(page, nextUrl, log));
	} else {
		log('No more stories found in the series.');
	}

	return storiesContent;
}

async function handleSeriesPage(page, url, log) {
	const storiesContent = [];
	await navigateToPage(page, url);
	while (true) {
		const firstStoryLink = await page.$('ul.series li h4.heading a');
		if (!firstStoryLink) {
			log('No more stories found in the series.');
			break;
		}
		const firstStoryUrl = await page.evaluate(
			(link) => link.href,
			firstStoryLink
		);

		log(`Navigating to story URL: ${firstStoryUrl}`);
		storiesContent.push(handleSingleChapterPage(page, firstStoryUrl, log));
	}
	return storiesContent;
}

async function getSeriesContent(url, log) {
	const browser = await launchBrowser();
	const page = await browser.newPage();
	await page.setCacheEnabled(false);

	let storiesContent = [];

	if (url.includes('/series/')) {
		storiesContent = await handleSeriesPage(page, url, log);
	} else {
		storiesContent = await handleSingleChapterPage(page, url, log);
	}

	await browser.close();
	return storiesContent;
}

async function generateCombinedPdf(contentArray, log) {
	const browser = await launchBrowser();
	const page = await browser.newPage();
	await page.setCacheEnabled(false);

	const combinedContent = contentArray.join(
		'<div style="page-break-before: always;"></div>'
	);
	await page.setContent(combinedContent);
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
	return pdfBuffer;
}

async function generateCombinedEpub(contentArray, log) {
	const epubOptions = {
		title: 'Fanfic Series',
		author: 'Unknown',
		content: contentArray.map((content, index) => ({
			title: `Story ${index + 1}`,
			data: content,
		})),
	};

	const outputPath = path.join('/tmp', 'series.epub');
	await new Epub(epubOptions, outputPath).promise;

	const epubBuffer = await readFile(outputPath);
	log('EPUB generated successfully');
	return epubBuffer;
}

export default async ({ req, res, log }) => {
	try {
		log('Function invoked');
		log(`Request object: ${JSON.stringify(req.body)}`);

		const { url, type } = req.body;

		if (!url) {
			log('No URL provided');
			return res.send({ error: 'URL is required' }, 400);
		}

		if (!type) {
			log('No type provided');
			return res.send({ error: 'Type is required' }, 400);
		}

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

		log(`Fetching series content from URL: ${url}`);
		const seriesContent = await getSeriesContent(url, log);
		log('Content fetched successfully');

		let buffer;
		let contentType;

		if (type === 'pdf') {
			buffer = await generateCombinedPdf(seriesContent, log);
			contentType = 'application/pdf';
		} else if (type === 'epub') {
			buffer = await generateCombinedEpub(seriesContent, log);
			contentType = 'application/epub+zip';
		} else {
			log('Unsupported file type requested');
			return res.send({ error: 'Unsupported file type requested' }, 400);
		}

		return res.send(buffer, 200, { 'Content-Type': contentType });
	} catch (err) {
		log(`Error occurred: ${err}`);
		return res.send({ error: err.toString() }, 500);
	}
};
