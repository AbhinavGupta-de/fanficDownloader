import { useState } from 'react';

const Popup = () => {
	const [downloadType, setDownloadType] = useState('');

	const handleDownload = () => {
		chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
			chrome.runtime.sendMessage(
				{ downloadType: downloadType, url: tabs[0].url },
				function (response) {
					if (response.status === 'success') {
						// Handle successful download
						console.log('Downloaded file: ', response.file);
					} else {
						// Handle error
						console.log('Error: ', response.error);
					}
				}
			);
		});
	};

	return (
		<div className="popup">
			<h1>AO3 Downloader</h1>
			<div className="download-options">
				<div>
					<input
						type="radio"
						id="chapter"
						value="chapter"
						checked={downloadType === 'chapter'}
						onChange={(e) => setDownloadType(e.target.value)}
					/>
					<label htmlFor="chapter">Download Chapter</label>
				</div>
				<div>
					<input
						type="radio"
						id="series"
						value="series"
						checked={downloadType === 'series'}
						onChange={(e) => setDownloadType(e.target.value)}
					/>
					<label htmlFor="series">Download Series</label>
				</div>
			</div>
			<button onClick={handleDownload}>Download</button>
		</div>
	);
};

export { Popup };
