const Main = () => {
	const title = document.querySelector('title heading');
	const author = document.querySelector('byline heading');
	return (
		<div className="flex p-5">
			<div className="flex flex-col">
				<div className="text-white">{title ? title.textContent : 'Invalid '}</div>
				<div className="text-white">{author ? author.textContent : 'Invalid '}</div>
			</div>
		</div>
	);
};

export default Main;
