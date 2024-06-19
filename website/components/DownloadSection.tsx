import Image from 'next/image';
import React from 'react';

const DownloadSection = () => {
	return (
		<div className="flex flex-col gap-2">
			<h1 className="text-[25px] font-bold text-primary p-2 font-writing">
				Download Section
			</h1>
			<Image src="/logo/download.png" alt="logo" width={320} height={120} />
			<p>
				This is the download section of the extension, as above shown in the image
				you can have the download button. There is also a dropdown button where you
				can select if you want to download <span>single chapter </span> or{' '}
				<span>full story</span> or the <span>whole series</span>
			</p>
			<p>
				You can also choose in what format you want to download the story. Two
				formats are avaiable for now, that is epub and pdf.
			</p>
			<div className="flex gap-2">
				<Image src="/logo/dropdown.png" alt="dropdown" width={200} height={100} />
				<Image
					src="/logo/downloadType.png"
					alt="download Type"
					width={200}
					height={100}
				/>
			</div>
		</div>
	);
};

export default DownloadSection;
