type Props = {};

const Features = (props: Props) => {
	return (
		<div className="flex flex-col gap-2">
			<h1 className="text-[25px] font-bold text-primary p-2 font-writing">
				Features
			</h1>

			<p>Some of the features of the extension till now are:</p>
			<ul className="">
				<li>
					<span className="text-primary">Site Supported:</span> archieveofourown.org
				</li>
				<li>
					<span className="text-primary">Download:</span> Download the story in
					epub/pdf format.
				</li>
				<li>
					<span className="text-primary">Story type:</span> Single chapter, full
					story, whole series.
				</li>
			</ul>
		</div>
	);
};

export default Features;
