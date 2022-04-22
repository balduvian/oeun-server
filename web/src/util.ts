import * as react from 'react';
import { ErrorResonse as ErrorResponse, Highlights, MessageResponse, NewCard, NewField } from './types';

export const OK = 200;

const handle = <T>(res: Response): Promise<[number, T | ErrorResponse]> => res.json().then(json => [res.status, json]);

/* ==== FETCH ==== */

export const getRequest = <T>(url: string) => fetch(url).then(res => handle<T>(res));

export const imagePostRequest = <T>(url: string, data: ArrayBuffer) => fetch(url, { method: 'POST', body: data }).then(res => handle<T>(res));

export const postRequest = <T>(url: string, data: any) => fetch(url, { method: 'POST', body: JSON.stringify(data) }).then(res => handle<T>(res));

export const patchRequest = <T>(url: string, data: any) => fetch(url, { method: 'PATCH', body: JSON.stringify(data) }).then(res => handle<T>(res));

export const deleteRequest = <T>(url: string) => fetch(url, { method: 'DELETE' }).then(res => handle<T>(res));

/* ==== */

export const isGood = <T>(code: number, data: T | ErrorResponse): data is T => {
	return code === OK;
};

export const wait = (time: number) => new Promise(acc => setTimeout(acc, time));

export const strToHighlights = (str: string) => {
	/* get indices of all the star markers */
	const indicies: number[] = [];
	let start = 0;
	while (true) {
		const nextIndex = str.indexOf('**', start);
		if (nextIndex === -1) {
			break;
		} else {
			indicies.push(nextIndex);
			start = nextIndex + 2;
		}
	}

	/* remove last fake index (no closing **) */
	if (indicies.length % 2 == 1) {
		indicies.pop();
	}

	/* don't need any processing */
	if (indicies.length === 0) return [{ part: str, highlight: false }];

	const ret: Highlights = [];

	/* for each pair of indices */
	for (let i = 0; i < indicies.length / 2; ++i) {
		ret.push({
			part: str.substring(i === 0 ? 0 : indicies[(i - 1) * 2 + 1] + 2, indicies[i * 2]),
			highlight: false,
		});
		ret.push({
			part: str.substring(indicies[i * 2] + 2, indicies[i * 2 + 1]),
			highlight: true,
		});
	}
	/* part after last pair */
	ret.push({
		part: str.substring(indicies[indicies.length - 1] + 2),
		highlight: false,
	});

	return ret;
};

const blankNewField = <T>(nullable: boolean): NewField<T> => ({
	value: undefined,
	nullable: nullable,
	error: false,
	ref: react.createRef(),
});

export const blankNewCard = (): NewCard => ({
	word: blankNewField(false),
	part: blankNewField(true),
	definition: blankNewField(false),
	sentence: blankNewField(true),
	picture: blankNewField(true),
});
