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

	useEffect(() => {
		chrome.tabs.query(
			{ active: true, currentWindow: true },
			(tabs: chrome.tabs.Tab[]) => {
				if (tabs[0].id !== undefined) {
					chrome.tabs.sendMessage(
						tabs[0].id,
						{ action: 'extractData' },
						(response: Data) => {
							if (response) {
								setData(response);
							} else {
								setData({
									storyName: '',
									author: '',
									siteName: '',
								});
							}
						}
					);
				}
			}
		);
	}, []);

	return (
		<div className="">
			<div className="">
				{data.storyName ||
				data.author ||
				data.storyName != '' ||
				data.author != '' ? (
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
				) : (
					<div className="flex flex-col justify-center items-center mx-auto">
						<img src="/icons/cute-sad.gif" alt="Sad face" className="w-[120px]" />
						<div className="p-2 text-primary text-[18px] text-center">
							Sorry, we don't have what you are looking for...
						</div>
					</div>
				)}
			</div>
		</div>
	);
};

export default Main;
