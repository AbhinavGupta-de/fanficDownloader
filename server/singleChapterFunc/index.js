import puppeteer from 'puppeteer';

async function getChapterContent(url, log) {
	const browser = await puppeteer.launch({
		args: ['--no-sandbox', '--disable-setuid-sandbox'],
	});
	const page = await browser.newPage();
	await page.goto(url, { waitUntil: 'networkidle2' });

	const chapterContent = await page.$eval('#workskin', (div) => div.innerHTML);

	await browser.close();
	return chapterContent;
}

export default async ({ req, res, log }) => {
	try {
		log('Function invoked'); // Log the function invocation

		const { url } = req.body;
		if (!url) {
			return res.json({ error: 'URL is required' }, 400);
		}

		const chapterContent = await getChapterContent(url, log);

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
		log('PDF generated successfully');

		return res.send(pdfBuffer, 200, { 'Content-Type': 'application/pdf' });
	} catch (err) {
		log(`Error occurred: ${err}`);
		return res.json({ error: err.toString() }, 500);
	}
};
