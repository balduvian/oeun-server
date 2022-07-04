import * as react from 'react';
import * as util from './util';

/**
 *
 * this file is a fucking mess
 * do not even try to understand what's going on
 *
 */

type Props<E extends HTMLInputElement | HTMLParagraphElement> = {
	smart: boolean;
	onKeyDown?: (event: react.KeyboardEvent<E>) => void;
	inputProps: react.DetailedHTMLProps<react.InputHTMLAttributes<E>, E>;
};

const bracketTypes = {
	'*': ['**', '**'] as const,
	')': ['(', ')'] as const,
};

const isHangul = (code: number) => {
	return (
		(code >= 0x3131 && code <= 0x318e) || (code >= 0xac00 && code <= 0xd7a3)
	);
};

const findStarStart = (text: string): [number, boolean] => {
	if (text.length === 0) return [-1, false];
	if (!isHangul(text.charCodeAt(text.length - 1))) return [-1, false];

	for (let i = text.length - 2; i >= 0; --i) {
		const behind = text.charCodeAt(i);
		if (!isHangul(behind)) return [i + 1, behind !== '*'.charCodeAt(0)];
	}

	return [0, true];
};

export const getRange = (
	selection: Selection,
): [number | undefined, number | undefined] => {
	if (selection.rangeCount !== 1) return [undefined, undefined];
	const range = selection.getRangeAt(0);
	if (range.startContainer !== range.endContainer)
		return [undefined, undefined];
	return [range.startOffset, range.endOffset];
};

export const getSelection = () => getRange(window.getSelection()!);

const createRange = (node: Node, start: number, end: number) => {
	const newRange = document.createRange();
	newRange.setStart(node.firstChild!, start);
	newRange.setEnd(node.firstChild!, end);
	return newRange;
};

export const setSelection = (element: Node, start: number, end: number) => {
	const selection = window.getSelection()!;
	selection.empty();
	selection.addRange(createRange(element, start, end));
};

const bracketText = (
	text: string,
	before: string,
	after: string,
	start: number,
	end: number,
) => {
	return (
		text.substring(0, start) +
		before +
		text.substring(start, end) +
		after +
		text.substring(end)
	);
};

const composingEvents = {
	onCompositionStart: (event: react.CompositionEvent<HTMLElement>) =>
		util.setElBool(event.currentTarget, 'composing', true),
	onCompositionEnd: (event: react.CompositionEvent<HTMLElement>) =>
		util.setElBool(event.currentTarget, 'composing', false),
};

type Bracketing = {
	text: string;
	selection: [number, number];
};

export const externalDoBracketing = <E extends HTMLElement>(
	event: react.KeyboardEvent<E>,
	text: string,
	range: [number | undefined, number | undefined],
): Bracketing | undefined => {
	if (!(event.key in bracketTypes)) return undefined;
	const [before, after] =
		bracketTypes[event.key as keyof typeof bracketTypes];

	const [start, end] = range;
	if (start === undefined || end === undefined) {
		return undefined;
	}

	if (start === end && end === text.length) {
		const [startIndex, doBefore] = findStarStart(text);
		if (startIndex !== -1) {
			const newText = bracketText(
				text,
				doBefore ? before : '',
				after,
				startIndex,
				text.length,
			);
			return {
				text: newText,
				selection: [newText.length, newText.length],
			};
		}
	} else if (start !== end) {
		const offset = before.length + after.length;
		return {
			text: bracketText(text, before, after, start, end),
			selection: [end + offset, end + offset],
		};
	}

	return undefined;
};

export const KorInput = react.memo(
	({ smart, onKeyDown, inputProps }: Props<HTMLInputElement>) => (
		<input
			{...composingEvents}
			onKeyDown={event => {
				if (util.getElBool(event.currentTarget, 'composing')) {
					return;
				}

				const bracketing = smart
					? externalDoBracketing(event, event.currentTarget.value, [
							event.currentTarget.selectionStart ?? undefined,
							event.currentTarget.selectionEnd ?? undefined,
					  ])
					: undefined;
				if (bracketing !== undefined) {
					const {
						text,
						selection: [start, end],
					} = bracketing;
					event.currentTarget.value = text;
					event.currentTarget.setSelectionRange(start, end);
					event.preventDefault();
				} else {
					if (onKeyDown !== undefined) onKeyDown(event);
				}
			}}
			{...inputProps}
		/>
	),
);
