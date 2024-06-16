import Image from 'next/image';
import React from 'react';

const Toolbar = () => {
	return (
		<div className="flex flex-col gap-2">
			<h2 className="text-[25px] font-bold text-primary p-2 font-writing">
				Toolbar Icon
			</h2>
			<Image src="/logo/toolbar.jpg" alt="logo" width={320} height={120} />
			<p>
				If Fanfic Downloader <span className="font-bold">is hidden</span> after
				installation, click the Extensions button and the pin button next to the
				extension!
			</p>
		</div>
	);
};

export default Toolbar;
