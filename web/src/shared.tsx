import * as react from 'react';
import { Part } from './types';
import WindowEvent from './windowEvent';

type PartOptionsProps = {
	parts: Part[];
};

export const PartOptions = react.memo(({ parts }: PartOptionsProps) => (
	<>
		{parts.map(part => (
			<option key={part.id} value={part.id}>
				{part.english}
			</option>
		))}
		<option value=""></option>
	</>
));

export const killCtrlZ = () => (
	<WindowEvent
		eventName="keydown"
		callback={event => {
			if (event.code === 'KeyZ' && event.ctrlKey) event.preventDefault();
		}}
	/>
);
