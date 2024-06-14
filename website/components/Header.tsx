import Image from 'next/image';
import React from 'react';

const Header = () => {
	return (
		<header className="flex justify-center items-center w-full">
			<Image src="/logo/logo.png" alt="logo" width={512} height={128} />
		</header>
	);
};

export default Header;
