import * as react from 'react';
import * as util from './util';

type Props = {
	smart: boolean;
	onKeyDown?: (event: react.KeyboardEvent<HTMLInputElement>) => void;
	inputProps: react.DetailedHTMLProps<react.InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>;
};

const isHangul = (code: number) => {
	return (code >= 0x3131 && code <= 0x318e) || (code >= 0xac00 && code <= 0xd7a3);
};

const findStarStart = (text: string) => {
	if (text.length === 0) return -1;
	if (!isHangul(text.charCodeAt(text.length - 1))) return -1;

	for (let i = text.length - 2; i >= 0; --i) {
		if (!isHangul(text.charCodeAt(i))) return i + 1;
	}

	return 0;
};

const KorInput = react.memo(({ smart, onKeyDown, inputProps: events }: Props) => (
	<input
		onCompositionStart={event => util.setElBool(event.currentTarget, 'composing', true)}
		onCompositionEnd={event => util.setElBool(event.currentTarget, 'composing', false)}
		onKeyDown={event => {
			if (util.getElBool(event.currentTarget, 'composing')) {
				return;
			}

			if (smart && event.key === '*') {
				const text = event.currentTarget.value;
				const start = event.currentTarget.selectionStart;
				const end = event.currentTarget.selectionEnd;

				if (start === null || end === null) return;
				if (start === end && end === text.length) {
					const startIndex = findStarStart(text);
					if (startIndex !== -1) {
						event.preventDefault();
						event.currentTarget.value = text.substring(0, startIndex) + '**' + text.substring(startIndex) + '**';
					}
				} else if (start !== end) {
					event.preventDefault();
					event.currentTarget.value = text.substring(0, start) + '**' + text.substring(start, end) + '**' + text.substring(end);
					event.currentTarget.setSelectionRange(end + 4, end + 4);
				}
			} else {
				if (onKeyDown !== undefined) onKeyDown(event);
			}
		}}
		{...events}
	/>
));

export default KorInput;
