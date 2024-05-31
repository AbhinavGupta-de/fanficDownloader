const Main = () => {
	const title = document.querySelector('title');
	const author = document.querySelector('byline heading');
	return (
		<div>
			<div>
				<div>{title ? title.textContent : 'Invalid '}</div>
				<div>{author ? author.textContent : 'Invalid '}</div>
			</div>
		</div>
	);
};

export default Main;
