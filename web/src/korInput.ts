import * as react from 'react';
import * as util from './util';

const bracketTypes = {
	'*': ['**', '**'] as const,
	_: ['__', '__'] as const,
	')': ['(', ')'] as const,
	"'": ["'", "'"] as const,
	'"': ['"', '"'] as const,
};

type BracketType = keyof typeof bracketTypes;

const getBracketType = (key: string): BracketType | undefined =>
	key in bracketTypes ? (key as BracketType) : undefined;

const isHangul = (code: number) => {
	return (
		(code >= 0x3131 && code <= 0x318e) || (code >= 0xac00 && code <= 0xd7a3)
	);
};

const findBracketStart = (
	text: string,
	bracketType: BracketType,
): [number, boolean] => {
	if (text.length === 0) return [-1, false];
	if (!isHangul(text.charCodeAt(text.length - 1))) return [-1, false];

	for (let i = text.length - 2; i >= 0; --i) {
		const behind = text.charCodeAt(i);
		if (!isHangul(behind))
			return [
				i + 1,
				behind !== bracketTypes[bracketType][0].charCodeAt(0),
			];
	}

	return [0, true];
};

const getRange = (
	selection: Selection,
): [number | undefined, number | undefined] => {
	if (selection.rangeCount !== 1) return [undefined, undefined];
	const range = selection.getRangeAt(0);
	if (range.startContainer !== range.endContainer)
		return [undefined, undefined];
	return [range.startOffset, range.endOffset];
};

const getSelection = () => getRange(window.getSelection()!);

const createRange = (node: Node, start: number, end: number) => {
	const newRange = document.createRange();
	newRange.setStart(node.firstChild!, start);
	newRange.setEnd(node.firstChild!, end);
	return newRange;
};

const internalSetSelection = (element: Node, start: number, end: number) => {
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

const isP = (element: HTMLElement): element is HTMLParagraphElement => {
	return element.nodeName === 'P';
};

const isInput = (element: HTMLElement): element is HTMLInputElement => {
	return element.nodeName === 'INPUT';
};

export const composingEvents = {
	onCompositionStart: (event: react.CompositionEvent<HTMLElement>) =>
		util.setElBool(event.currentTarget, 'composing', true),
	onCompositionEnd: (event: react.CompositionEvent<HTMLElement>) =>
		util.setElBool(event.currentTarget, 'composing', false),
};

export const isComposing = (event: react.KeyboardEvent<HTMLOrSVGElement>) =>
	util.getElBool(event.currentTarget, 'composing');

export type Bracketing = {
	text: string;
	selection: [number, number];
};

export const doBracketing = <E extends HTMLElement>(
	event: react.KeyboardEvent<E>,
) => {
	const element = event.currentTarget;
	if (isP(element)) {
		return internalDoBracketing(
			event.key,
			element.textContent!,
			getSelection(),
		);
	} else if (isInput(element)) {
		return internalDoBracketing(event.key, element.value, [
			element.selectionStart ?? undefined,
			element.selectionEnd ?? undefined,
		]);
	} else {
		throw 'Bad node type';
	}
};

const internalDoBracketing = (
	key: string,
	text: string,
	range: [number | undefined, number | undefined],
): Bracketing | undefined => {
	const bracketType = getBracketType(key);
	if (bracketType === undefined) return undefined;
	const [before, after] = bracketTypes[bracketType];

	const [start, end] = range;
	if (start === undefined || end === undefined) {
		return undefined;
	}

	if (start === end && end === text.length) {
		const [startIndex, doBefore] = findBracketStart(text, bracketType);
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

export const setSelection = (
	event: react.KeyboardEvent<HTMLElement>,
	{ text, selection: [start, end] }: Bracketing,
) => {
	const element = event.currentTarget;
	if (isP(element)) {
		element.textContent = text;
		internalSetSelection(element, start, end);
	} else if (isInput(element)) {
		element.value = text;
		element.setSelectionRange(start, end);
	}

	event.preventDefault();
};
