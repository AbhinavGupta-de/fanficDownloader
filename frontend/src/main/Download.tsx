import React, { useState, useEffect } from 'react';
import { fetchStory } from '../api/appwriteFunctions';

type SupportedSite = 'ao3' | 'ffn' | null;

const Download: React.FC = () => {
	const [type, setType] = useState('single');
	const [url, setUrl] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const [downloadType, setDownloadType] = useState('pdf');
	const [currentSite, setCurrentSite] = useState<SupportedSite>(null);

	// Detect site on mount
	useEffect(() => {
		chrome.tabs.query(
			{ active: true, currentWindow: true },
			(tabs: chrome.tabs.Tab[]) => {
				const tabUrl = tabs[0]?.url;
				if (tabUrl) {
					setUrl(tabUrl);
					if (tabUrl.includes('archiveofourown.org')) {
						setCurrentSite('ao3');
					} else if (tabUrl.includes('fanfiction.net')) {
						setCurrentSite('ffn');
					} else {
						setCurrentSite(null);
					}
				}
			}
		);
	}, []);

	// Reset type if series is selected on FFN
	useEffect(() => {
		if (currentSite === 'ffn' && type === 'series') {
			setType('single');
		}
	}, [currentSite, type]);

	const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		setType(e.target.value);
	};

	const handleDownloadType = (e: React.ChangeEvent<HTMLSelectElement>) => {
		setDownloadType(e.target.value);
	};

	const handleDownload = async () => {
		if (!url || !currentSite) {
			alert('Please navigate to a supported fanfiction site (AO3 or FFN).');
			return;
		}

		setLoading(true);
		try {
			await fetchStory(type, url, downloadType);
		} finally {
			setLoading(false);
		}
	};

	// Show unsupported message if not on a supported site
	if (currentSite === null && url) {
		return (
			<div className="flex p-5 flex-col gap-2">
				<div className="text-center text-sm text-gray-400">
					Please navigate to AO3 or FFN to download stories.
				</div>
			</div>
		);
	}

	return (
		<div className="flex p-5 flex-col gap-2">
			{loading ? (
				<div className="flex justify-center max-w-[120px] mx-auto items-center">
					<img src="/icons/runningBunny.gif" alt="Bunny running" />
				</div>
			) : (
				<>
					<div className="flex justify-center items-center gap-2">
						<select
							className="p-2 bg-secondary rounded-md font-medium text-lg"
							onChange={handleTypeChange}
							value={type}
						>
							<option value="single">Single Chapter</option>
							<option value="multi">Full Story</option>
							{/* Only show series option for AO3 */}
							{currentSite === 'ao3' && (
								<option value="series">Whole Series</option>
							)}
						</select>

						<select
							className="p-2 bg-secondary rounded-md font-medium text-lg"
							onChange={handleDownloadType}
							value={downloadType}
						>
							<option value="pdf">PDF</option>
							<option value="epub">EPUB</option>
						</select>
					</div>
					<div className="flex justify-center items-center">
						<button
							className="p-2 bg-backgroundSecondary rounded-xl font-thin text-lg"
							onClick={handleDownload}
							disabled={loading}
						>
							Download
						</button>
					</div>
				</>
			)}
		</div>
	);
};

export default Download;
