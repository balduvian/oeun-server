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

type Range<N, A extends unknown[] = []> = N extends A['length']
	? A[keyof A & number]
	: Range<N, [...A, A['length']]>;

type Sequence<N, A extends unknown[] = []> = N extends A['length']
	? A
	: Sequence<N, [...A, A['length']]>;

type F = Sequence<8>;

export const pngDataURL = (dataPart: string): string => {
	return `data:image/png;base64,${dataPart}`;
};

export const isDataURL = (string: string): boolean => {
	return string.indexOf('base64,') != -1;
};

export const stripJustDataPart = (data: string): string => {
	const index = data.indexOf('base64,');
	if (index === -1) return data;
	return data.substring(index + 7);
};

export const base64ToBuffer = (base64: string): ArrayBuffer => {
	var binaryImg = window.atob(base64);
	var length = binaryImg.length;
	var buffer = new ArrayBuffer(length);
	var array = new Uint8Array(buffer);
	for (var i = 0; i < length; i++) {
		array[i] = binaryImg.charCodeAt(i);
	}
	return buffer;
};

export const bufferToBase64 = (arrayBuffer: ArrayBuffer): string => {
	var base64 = '';
	var encodings =
		'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

	var bytes = new Uint8Array(arrayBuffer);
	var byteLength = bytes.byteLength;
	var byteRemainder = byteLength % 3;
	var mainLength = byteLength - byteRemainder;

	var a, b, c, d;
	var chunk;

	// Main loop deals with bytes in chunks of 3
	for (var i = 0; i < mainLength; i = i + 3) {
		// Combine the three bytes into a single integer
		chunk = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2];

		// Use bitmasks to extract 6-bit segments from the triplet
		a = (chunk & 16515072) >> 18; // 16515072 = (2^6 - 1) << 18
		b = (chunk & 258048) >> 12; // 258048   = (2^6 - 1) << 12
		c = (chunk & 4032) >> 6; // 4032     = (2^6 - 1) << 6
		d = chunk & 63; // 63       = 2^6 - 1

		// Convert the raw binary segments to the appropriate ASCII encoding
		base64 += encodings[a] + encodings[b] + encodings[c] + encodings[d];
	}

	// Deal with the remaining bytes and padding
	if (byteRemainder == 1) {
		chunk = bytes[mainLength];

		a = (chunk & 252) >> 2; // 252 = (2^6 - 1) << 2

		// Set the 4 least significant bits to zero
		b = (chunk & 3) << 4; // 3   = 2^2 - 1

		base64 += encodings[a] + encodings[b] + '==';
	} else if (byteRemainder == 2) {
		chunk = (bytes[mainLength] << 8) | bytes[mainLength + 1];

		a = (chunk & 64512) >> 10; // 64512 = (2^6 - 1) << 10
		b = (chunk & 1008) >> 4; // 1008  = (2^6 - 1) << 4

		// Set the 2 least significant bits to zero
		c = (chunk & 15) << 2; // 15    = 2^4 - 1

		base64 += encodings[a] + encodings[b] + encodings[c] + '=';
	}

	return base64;
};
