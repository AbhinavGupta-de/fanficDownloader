import React from 'react';

const Contact = () => {
	return (
		<div className="flex flex-col gap-2">
			<h1 className="text-[25px] font-bold text-primary p-2 font-writing">
				Contact
			</h1>
			<p>
				For any qurries contact me {` `}
				<a
					href="mailto:abhinavgupta4505@gmail.com"
					className="underline text-primary"
				>
					here.
				</a>
			</p>
		</div>
	);
};

export default Contact;
