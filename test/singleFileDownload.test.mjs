import fetch from 'node-fetch';
import fs from 'fs';

async function generateAndSaveFile(type) {
	try {
		console.log(
			`Starting the process to generate a ${type.toUpperCase()} file...`
		);

		const response = await fetch(
			'https://66707abeeafd1f8178e8.appwrite.global/',
			{
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					url: 'https://archiveofourown.org/works/25830817',
					type: type,
				}),
			}
		);

		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(`Failed to fetch: ${response.status} - ${errorText}`);
		}

		const buffer = await response.buffer();
		const fileName =
			type === 'epub' ? 'generated-epub.epub' : 'generated-pdf.pdf';

		fs.writeFileSync(fileName, buffer);

		console.log(`${fileName} generated and saved successfully.`);
	} catch (error) {
		console.error('Error during file generation:', error);
	}
}

// generateAndSaveFile('pdf');
generateAndSaveFile('epub');
