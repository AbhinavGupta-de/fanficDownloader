const Header = () => {
	return (
		<div className="flex flex-col p-5 mx-auto">
			<div className="flex w-full justify-between">
				<img src="/image.png" alt="Logo" className="w-[50px]" />
				<div className="text-primary text-[28px] text-center">
					Fanfic Downloader
				</div>
			</div>
			<div className="text-white underline w-full text-center text-[20px]">
				Keep Reading
			</div>
		</div>
	);
};

export default Header;
