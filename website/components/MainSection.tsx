import Image from 'next/image';
import React from 'react';

const MainSection = () => {
	return (
		<div className="flex flex-col">
			<h2>Top Section</h2>
			<div className="flex">
				<Image src="/logo/top.png" alt="logo" width={320} height={120} />
				<Image src="/logo/top.png" alt="logo" width={320} height={120} />
			</div>
			<p>
				This is header and top section of the extension, as above shown in the
				images you can have two possible veiws of the extension.
			</p>
			<ul>
				<li> - One is the story name, author name and the site name.</li>
				<li>
					{`
					- The other one is sad bunny image and text "Sorry, we don't have what you are
					looking for...".`}
				</li>
			</ul>
			<p>
				Based on the which website you are on the extension will show the respective
				view.
			</p>
		</div>
	);
};

export default MainSection;
