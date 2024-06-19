const Footer = () => {
	const handleGitHubClick = () => {
		chrome.tabs.create({
			url: 'https://github.com/AbhinavGupta-de/fanficDownloader',
		});
	};

	const handleWebsiteClick = () => {
		chrome.tabs.create({
			url: '',
		});
	};

	return (
		<footer className="p-5 fixed bottom-0 flex gap-2 text-primary justify-center items-center text-[18px] w-full">
			<a href="" onClick={handleGitHubClick} className="underline">
				Github
			</a>
			<a href="" onClick={handleWebsiteClick} className="underline">
				Help?
			</a>
		</footer>
	);
};

export default Footer;
