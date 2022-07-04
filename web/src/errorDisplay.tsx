import React from 'react';

type Props = {
	error: boolean;
	children?: React.ReactChild | React.ReactChild[];
};

const ErrorDisplay = ({ error, children }: Props) => {
	return (
		<>
			{error ? (
				<div className="blank-holder">
					<p>An error occured</p>
				</div>
			) : (
				children
			)}
		</>
	);
};

export default ErrorDisplay;
