const Download = () => {
	return (
		<div className="flex p-5 flex-col gap-2">
			<div className="flex justify-center items-center">
				<select className="p-2 bg-secondary rounded-md font-medium">
					<option value="sc">Single Chapter</option>
					<option value="fs">Full Story</option>
					<option value="ws">Whole Series</option>
				</select>
			</div>
			<div className="flex justify-center items-center">
				<button className="p-2 bg-backgroundSecondary  rounded-xl font-thin">
					Download
				</button>
			</div>
		</div>
	);
};

export default Download;
