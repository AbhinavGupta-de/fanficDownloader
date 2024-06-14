import Image from 'next/image';
import React from 'react';

const LinkSection = () => {
	return (
		<div>
			<Image src="/logo/footer.png" alt="footer" width={280} height={120} />
			<p>
				This section contains links to different things like this is an open source
				extension so link to the GitHub repo.
			</p>
		</div>
	);
};

export default LinkSection;
