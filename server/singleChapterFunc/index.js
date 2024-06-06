import puppeteer from 'puppeteer';

async function getChapterContent(url) {
	const browser = await puppeteer.launch({
		args: ['--no-sandbox', '--disable-setuid-sandbox'],
	});
	const page = await browser.newPage();
	await page.goto(url, { waitUntil: 'networkidle2' });

	const chapterContent = await page.$eval('#workskin', (div) => div.innerHTML);

	await browser.close();
	return chapterContent;
}

export default async ({ req, res, log, error }) => {
	try {
		const { url } = JSON.parse(req.payload); // Appwrite Cloud Functions use req.payload for request data
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

		res.setHeader('Content-Type', 'application/pdf');
		res.send(pdfBuffer);
	} catch (error) {
		if (error instanceof Error) {
			res.status(500).send(error.toString());
		} else {
			res.status(500).send('An unknown error occurred');
		}
	}
};
