import { ErrorResponse as ErrorResponse, Highlights } from './types';

export const OK = 200;

const handle = <T>(res: Response): Promise<T> =>
	res.json().then((json: T | ErrorResponse) => {
		if (isGood(res.status, json)) {
			return json;
		} else {
			throw json;
		}
	});

/* ==== FETCH ==== */

export const getRequest = <T>(url: string) =>
	fetch(url).then(res => handle<T>(res));

export const imagePostRequest = <T>(url: string, data: ArrayBuffer | string) =>
	fetch(url, { method: 'POST', body: data }).then(res => handle<T>(res));

export const postRequest = <T>(url: string, data: any) =>
	fetch(url, { method: 'POST', body: JSON.stringify(data) }).then(res =>
		handle<T>(res),
	);

export const patchRequest = <T>(url: string, data: any) =>
	fetch(url, { method: 'PATCH', body: JSON.stringify(data) }).then(res =>
		handle<T>(res),
	);

export const putRequest = <T>(url: string, data: any) =>
	fetch(url, { method: 'PUT', body: JSON.stringify(data) }).then(res =>
		handle<T>(res),
	);

export const deleteRequest = <T>(url: string) =>
	fetch(url, { method: 'DELETE' }).then(res => handle<T>(res));

/* ==== */

const isGood = <T>(code: number, data: T | ErrorResponse): data is T => {
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
			part: str.substring(
				i === 0 ? 0 : indicies[(i - 1) * 2 + 1] + 2,
				indicies[i * 2],
			),
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

export const setElBool = (
	target: HTMLOrSVGElement,
	name: string,
	value: boolean,
) => {
	value ? (target.dataset[name] = 't') : delete target.dataset[name];
};

export const getElBool = (target: HTMLOrSVGElement, name: string) => {
	return target.dataset[name] !== undefined;
};

export const coerceIn = (value: number, low: number, high: number): number => {
	return value < low ? low : value > high ? high : value;
};

export const coerceAtLeast = (value: number, low: number): number => {
	return value < low ? low : value;
};

export const coerceAtMost = (value: number, high: number): number => {
	return value > high ? high : value;
};

export const makeUrl = (url: string): string => {
	const { host, protocol } = window.location;
	return protocol + '//' + host + '/' + url;
};

export const intOrUndefined = (input: string | undefined) => {
	if (input === undefined) return undefined;
	const num = Number.parseInt(input);
	return isNaN(num) ? undefined : num;
};

export const mod = (a: number, b: number) => ((a % b) + b) % b;
