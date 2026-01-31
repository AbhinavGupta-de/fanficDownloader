import React, { useState, useEffect } from 'react';
import { fetchStory } from '../api/appwriteFunctions';
import { getEstimatedTime } from '../api/config';
import type { JobStatus } from '../api/jobQueue';

type SupportedSite = 'ao3' | 'ffn' | null;

const Download: React.FC = () => {
	const [type, setType] = useState('single');
	const [url, setUrl] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const [downloadType, setDownloadType] = useState('epub');
	const [currentSite, setCurrentSite] = useState<SupportedSite>(null);
	const [progressMessage, setProgressMessage] = useState<string>('');
	const [error, setError] = useState<string | null>(null);

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

	const handleProgress = (_status: JobStatus, _progress: number, message?: string) => {
		if (message) {
			setProgressMessage(message);
		}
	};

	const handleDownload = async () => {
		if (!url || !currentSite) {
			alert('Please navigate to a supported fanfiction site (AO3 or FFN).');
			return;
		}

		setLoading(true);
		setError(null);
		setProgressMessage('Starting download...');

		try {
			await fetchStory(type, url, downloadType, handleProgress);
			setProgressMessage('Download complete!');
		} catch (err) {
			const errorMsg = err instanceof Error ? err.message : 'Download failed';
			setError(errorMsg);
			setProgressMessage('');
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

	const estimatedTime = currentSite
		? getEstimatedTime(currentSite, type, downloadType)
		: null;

	return (
		<div className="flex p-5 flex-col gap-2">
			{loading ? (
				<div className="flex flex-col justify-center items-center gap-2">
					<div className="max-w-[120px]">
						<img src="/icons/runningBunny.gif" alt="Bunny running" />
					</div>
					<p className="text-xs text-gray-300 text-center font-medium">
						{progressMessage}
					</p>
					<p className="text-xs text-gray-500 text-center">
						Large stories may take several minutes.
						<br />
						Please keep this popup open.
					</p>
				</div>
			) : (
				<>
					{error && (
						<div className="bg-red-900/50 text-red-300 text-xs p-2 rounded-md text-center mb-2">
							{error}
						</div>
					)}

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
							<option value="epub">EPUB</option>
							<option value="pdf">PDF</option>
						</select>
					</div>

					{/* Estimated time display */}
					{estimatedTime && (
						<p className="text-xs text-gray-400 text-center">
							⏱️ Estimated: {estimatedTime}
						</p>
					)}

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
