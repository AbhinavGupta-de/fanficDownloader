import React, { useState } from 'react';
import { fetchStory } from '../api/appwriteFunctions';

const Download: React.FC = () => {
	const [type, setType] = useState('single');
	const [url, setUrl] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		setType(e.target.value);
	};

	const handleDownload = async () => {
		chrome.tabs.query(
			{ active: true, currentWindow: true },
			(tabs: chrome.tabs.Tab[]) => {
				if (tabs[0].url && tabs[0].url.includes('archiveofourown.org')) {
					setUrl(tabs[0].url);
				} else {
					alert('Please navigate to a valid archiveofourown.org page.');
					return;
				}
			}
		);

		if (url && url.includes('archiveofourown.org')) {
			setLoading(true);
			try {
				await fetchStory(type, url);
			} finally {
				setLoading(false);
			}
		}
	};

	return (
		<div className="flex p-5 flex-col gap-2">
			{loading ? (
				<div className="flex justify-center max-w-[120px] mx-auto items-center">
					<img src="/icons/runningBunny.gif" alt="Bunny running" />
				</div>
			) : (
				<>
					<div className="flex justify-center items-center">
						<select
							className="p-2 bg-secondary rounded-md font-medium text-lg"
							onChange={handleTypeChange}
						>
							<option value="single">Single Chapter</option>
							<option value="multi">Full Story</option>
							<option value="series">Whole Series</option>
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
