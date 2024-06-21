import Image from 'next/image';
import React from 'react';

const LinkSection = () => {
	return (
		<div className="flex flex-col gap-2">
			<h1 className="text-[25px] font-bold text-primary p-2 font-writing">
				Links
			</h1>
			<Image src="/logo/links.png" alt="footer" width={280} height={120} />
			<p>
				This section contains links to different things like this is an open source
				extension so link to the GitHub repo.
			</p>
		</div>
	);
};

export default LinkSection;
