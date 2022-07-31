export type Go = {
	url: string;
};

export const createGo = (
	path: string,
	query: { [key: string]: string | undefined } | undefined = undefined,
): Go => {
	return {
		url: query === undefined ? path : `${path}?${makeQueryString(query)}`,
	};
};

const makeQueryString = (obj: { [key: string]: string | undefined }): string =>
	Object.keys(obj)
		.map(key => {
			const value = obj[key];
			return value === undefined
				? undefined
				: `${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
		})
		.filter((value): value is string => value !== undefined)
		.join('&');
