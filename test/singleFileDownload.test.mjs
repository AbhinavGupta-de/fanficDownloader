import fetch from 'node-fetch';
import fs from 'fs';

async function generateAndSavePDF() {
	try {
		const response = await fetch(
			'http://127.0.0.1:5001/ffnd-d38f3/us-central1/downloadSingleChapter',
			{
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					url: 'https://archiveofourown.org/works/45424144/chapters/116931466',
				}),
			}
		);

		const pdfBuffer = await response.buffer();

		fs.writeFileSync('generated-pdf.pdf', pdfBuffer);

		console.log('PDF generated and saved successfully.');
	} catch (error) {
		console.error('Error:', error);
	}
}

generateAndSavePDF();
