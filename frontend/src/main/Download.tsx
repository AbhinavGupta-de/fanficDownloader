import React, { useState, useEffect, useRef } from 'react';
import { fetchStory } from '../api/appwriteFunctions';
import { getEstimatedTime } from '../api/config';
import type { JobStatus } from '../api/jobQueue';
import { getStoredJob } from '../api/jobStorage';

type SupportedSite = 'ao3' | 'ffn' | null;

const Download: React.FC = () => {
	const [type, setType] = useState('single');
	const [url, setUrl] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const [downloadType, setDownloadType] = useState('epub');
	const [currentSite, setCurrentSite] = useState<SupportedSite>(null);
	const [progressMessage, setProgressMessage] = useState<string>('');
	const [error, setError] = useState<string | null>(null);
	const hasCheckedExisting = useRef(false);

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

	// Check for existing job and auto-resume on mount
	useEffect(() => {
		if (!url || !currentSite || hasCheckedExisting.current) return;
		hasCheckedExisting.current = true;

		// Check all combinations of type and format for existing jobs
		const types: Array<'single-chapter' | 'multi-chapter' | 'series'> = ['single-chapter', 'multi-chapter', 'series'];
		const formats: Array<'pdf' | 'epub'> = ['epub', 'pdf'];

		for (const apiType of types) {
			for (const format of formats) {
				const existingJob = getStoredJob(url, apiType, format);
				if (existingJob) {
					// Found an existing job - set the UI state and auto-resume
					const uiType = apiType === 'single-chapter' ? 'single' : apiType === 'multi-chapter' ? 'multi' : 'series';
					setType(uiType);
					setDownloadType(format);

					// Auto-start the download (which will resume the existing job)
					console.log('Found existing job, auto-resuming:', existingJob.jobId);
					setLoading(true);
					setProgressMessage('Resuming previous download...');

					fetchStory(uiType, url, format, handleProgress)
						.then(() => {
							setProgressMessage('Download complete!');
							setTimeout(() => setProgressMessage(''), 3000);
						})
						.catch((err) => {
							const errorMsg = err instanceof Error ? err.message : 'Download failed';
							setError(errorMsg);
							setProgressMessage('');
						})
						.finally(() => {
							setLoading(false);
						});

					return; // Stop after finding first existing job
				}
			}
		}
	}, [url, currentSite]);

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
			// Clear success message after 3 seconds
			setTimeout(() => setProgressMessage(''), 3000);
		} catch (err) {
			const errorMsg = err instanceof Error ? err.message : 'Download failed';
			setError(errorMsg);
			setProgressMessage('');
		} finally {
			setLoading(false);
		}
	};

	// Don't render anything if not on a supported site
	if (currentSite === null) {
		return null;
	}

	const estimatedTime = currentSite
		? getEstimatedTime(currentSite, type, downloadType)
		: null;

	return (
		<div className="flex flex-col gap-3 mt-2">
			{/* Error display */}
			{error && (
				<div className="bg-red-500/20 border border-red-500/50 text-red-200 text-xs p-2 rounded-md text-center">
					<span className="font-medium">Error:</span> {error}
					<button
						onClick={() => setError(null)}
						className="ml-2 text-red-300 hover:text-white"
					>
						✕
					</button>
				</div>
			)}

			{loading ? (
				<div className="flex flex-col justify-center items-center gap-2 py-2 mb-4">
					<div className="max-w-[80px]">
						<img src="/icons/runningBunny.gif" alt="Downloading..." />
					</div>
					<p className="text-sm text-white text-center font-medium">
						{progressMessage}
					</p>
					<p className="text-xs text-white/50 text-center">
						Large stories may take several minutes.
					</p>
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
						<p className="text-sm text-white/80 text-center">
							⏱️ Estimated: {estimatedTime}
						</p>
					)}

					<div className="flex justify-center items-center">
						<button
							className="p-2 px-6 bg-backgroundSecondary rounded-xl font-medium text-lg hover:opacity-90 transition-opacity"
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
