const Main = () => {
	const title = document.querySelector('title heading');
	const author = document.querySelector('byline heading');
	return (
		<div className="">
			<div className="">
				{!title || !author ? (
					<div className="flex flex-col justify-center items-center mx-auto">
						<img src="/icons/cute-sad.gif" alt="Sad face" className="w-[120px]" />
						<div className="p-2 text-primary text-[18px] text-center">
							Sorry, we don't have what you are looking for...
						</div>
					</div>
				) : (
					<div>
						<div className="flex justify-center items-center">
							<h1 className="text-3xl font-bold">{title.innerHTML}</h1>
						</div>
						<div className="flex justify-center items-center">
							<h2 className="text-xl font-semibold">{author.innerHTML}</h2>
						</div>
					</div>
				)}
			</div>
		</div>
	);
};

export default Main;
