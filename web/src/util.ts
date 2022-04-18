import { Highlights } from './types';

export const jsonGetRequest = (url: string) =>
	new Promise<any>((acc, rej) =>
		fetch(url)
			.then(response => {
				response
					.json()
					.then(json => acc(json))
					.catch(rej);
			})
			.catch(rej),
	);

export const imagePostRequest = (url: string, data: ArrayBuffer) =>
	fetch(url, { method: 'POST', body: data }).then(response => response.json().then(json => json));

export const imageGetRequest = (url: string) =>
	new Promise<string>((acc, rej) =>
		fetch(url).then(response => {
			response
				.blob()
				.then(blob => {
					const reader = new FileReader();
					reader.onloadend = () => {
						/* remove this part 'data:/;base64,' */
						/* add this part 'data:image/jpg;base64,' */
						const result = reader.result as string;

						acc('data:image/jpg;base64,' + result.substring(result.indexOf(',') + 1));
					};
					reader.onerror = rej;
					reader.readAsDataURL(blob);
				})
				.catch(rej);
		}),
	);

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
