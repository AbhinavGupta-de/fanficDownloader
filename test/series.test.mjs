import fetch from 'node-fetch';
import fs from 'fs';

async function generateAndSaveSeriesPDF() {
	try {
		const response = await fetch('', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				url: 'https://archiveofourown.org/works/56736142',
				type: 'pdf',
			}),
		});

		const pdfBuffer = await response.buffer();

		fs.writeFileSync('series-generated-pdf.pdf', pdfBuffer);

		console.log('Series PDF generated and saved successfully.');
	} catch (error) {
		console.error('Error:', error);
	}
}

async function generateAndSaveSeriesEPUB() {
	try {
		const response = await fetch('', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				url: 'https://archiveofourown.org/works/56736142',
				type: 'epub',
			}),
		});

		const epubBuffer = await response.buffer();

		fs.writeFileSync('series-generated-epub.epub', epubBuffer);

		console.log('Series EPUB generated and saved successfully.');
	} catch (error) {
		console.error('Error:', error);
	}
}

generateAndSaveSeriesPDF();
generateAndSaveSeriesEPUB();
