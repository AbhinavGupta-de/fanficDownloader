import React from 'react';

const Footer = () => {
	return (
		<footer className="flex justify-center items-center p-5">
			<p>
				This page is developed by{' '}
				<a href="https://www.linkedin.com/in/abhinavgpt/" className="underline">
					Abhinav Gupta
				</a>{' '}
				and is open source on{' '}
				<a
					href="https://github.com/AbhinavGupta-de/fanficDownloader"
					className="underline"
				>
					GitHub.
				</a>
			</p>
		</footer>
	);
};

export default Footer;
