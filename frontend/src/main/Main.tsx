import React, { useEffect, useState } from 'react';

interface Data {
	storyName: string;
	author: string;
	siteName: string;
}

const Main: React.FC = () => {
	const [data, setData] = useState<Data>({
		storyName: '',
		author: '',
		siteName: '',
	});
	const [isLoading, setIsLoading] = useState(true);
	const [isSupportedSite, setIsSupportedSite] = useState(false);

	useEffect(() => {
		chrome.tabs.query(
			{ active: true, currentWindow: true },
			(tabs: chrome.tabs.Tab[]) => {
				const tabUrl = tabs[0]?.url || '';
				const isSupported = tabUrl.includes('archiveofourown.org') || tabUrl.includes('fanfiction.net');
				setIsSupportedSite(isSupported);

				if (!isSupported) {
					setIsLoading(false);
					return;
				}

				if (tabs[0].id !== undefined) {
					chrome.tabs.sendMessage(
						tabs[0].id,
						{ action: 'extractData' },
						(response: Data) => {
							setIsLoading(false);
							if (response && (response.storyName || response.author)) {
								setData(response);
							}
						}
					);
					// Timeout fallback in case content script doesn't respond
					setTimeout(() => setIsLoading(false), 2000);
				} else {
					setIsLoading(false);
				}
			}
		);
	}, []);

	// Show nothing while loading on supported sites
	if (isLoading && isSupportedSite) {
		return null;
	}

	// Not on a supported site
	if (!isSupportedSite) {
		return (
			<div className="flex flex-col justify-center items-center mx-auto">
				<img src="/icons/cute-sad.gif" alt="Sad face" className="w-[120px]" />
				<div className="p-2 text-primary text-[18px] text-center">
					Sorry, we don't have what you are looking for...
				</div>
			</div>
		);
	}

	// On supported site but no data extracted (content script failed or page structure different)
	if (!data.storyName && !data.author) {
		return null; // Don't show error, Download component will handle this
	}

	return (
		<div className="mb-5 flex gap-2 flex-col">
			<div className="flex justify-center items-center">
				<h1 className="text-xl font-medium text-white max-w-[350px] overflow-hidden text-ellipsis max-h-8 whitespace-nowrap">
					Story name: <span className="text-primary">{data.storyName}</span>
				</h1>
			</div>
			<div className="flex justify-center items-center">
				<h2 className="text-xl font-medium text-white overflow-hidden text-ellipsis">
					Author: <span className="text-primary">{data.author}</span>
				</h2>
			</div>
			<div className="flex justify-center items-center">
				<p className="font-medium text-white text-lg overflow-hidden text-ellipsis">
					This fanfiction is on{' '}
					<span className="text-primary">{data.siteName}</span>{' '}
				</p>
			</div>
		</div>
	);
};

export default Main;
