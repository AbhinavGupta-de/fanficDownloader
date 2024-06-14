import DownloadSection from '@/components/DownloadSection';
import LinkSection from '@/components/LinkSection';
import MainSection from '@/components/MainSection';
import Toolbar from '@/components/Toolbar';
import React from 'react';

const Home = () => {
	return (
		<div className="min-h-lvh p-5 gap-5 flex flex-col w-[50%] mx-auto">
			<p>This document will guide through the features of Fanfic Downloader.</p>
			<Toolbar />
			<MainSection />
			<DownloadSection />
			<LinkSection />
		</div>
	);
};

export default Home;
