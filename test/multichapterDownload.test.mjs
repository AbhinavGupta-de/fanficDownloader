import fetch from 'node-fetch';
import fs from 'fs';

async function generateAndSavePDF() {
	try {
		const response = await fetch(
			'https://667070bb2a3290c88cfb.appwrite.global/',
			{
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					url: 'https://archiveofourown.org/works/56434537/chapters/143401636',
					type: 'pdf',
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

async function generateAndSaveEPUB() {
	try {
		const response = await fetch(
			'https://667070bb2a3290c88cfb.appwrite.global/',
			{
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					url: 'https://archiveofourown.org/works/56434537/chapters/143401636',
					type: 'epub',
				}),
			}
		);

		const epubBuffer = await response.buffer();

		fs.writeFileSync('generated-epub.epub', epubBuffer);

		console.log('EPUB generated and saved successfully.');
	} catch (error) {
		console.error('Error:', error);
	}
}

// generateAndSavePDF();
generateAndSaveEPUB();
