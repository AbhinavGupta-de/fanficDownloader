import Image from 'next/image';
import React from 'react';

const DownloadSection = () => {
	return (
		<div>
			<Image src="/logo/download.png" alt="logo" width={320} height={120} />
			<p>
				This is the download section of the extension, as above shown in the image
				you can have the download button. There is also a dropdown button where you
				can select if you want to download <span>single chapter </span> or{' '}
				<span>full story</span> or the <span>whole story(it is WIP).</span>
			</p>
			<Image src="/logo/dropdown.png" alt="dropdown" width={200} height={100} />
		</div>
	);
};

export default DownloadSection;
