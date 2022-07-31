export enum PartType {
	MATCH,
	ANY,
	REST,
	NUMBER,
	STRING,
}

export type URLPart = {
	type: PartType;
	value: string;
};

export const toTemplateURL = (input: string): URLPart[] => {
	return input.split('/').map(part => {
		if (part === '**') return { type: PartType.REST, value: '' };
		if (part === '*') return { type: PartType.ANY, value: '' };
		if (part.startsWith(':'))
			return { type: PartType.STRING, value: part.slice(1) };
		if (part.startsWith('#'))
			return { type: PartType.NUMBER, value: part.slice(1) };
		return { type: PartType.MATCH, value: part };
	});
};

export type Query = { [key: string]: string | undefined };

type InputURL = {
	path: string[];
	query: Query;
};

const breakUpUrl = (input: string): InputURL => {
	const [pathPart, queryPart] = input.split('?') as [
		string,
		string | undefined,
	];
	return {
		path: pathPart.split('/'),
		query: Object.assign(
			{},
			...(queryPart
				?.split('&')
				.map(pair => {
					const [key, value] = pair.split('=') as [
						string,
						string | undefined,
					];
					return value !== undefined
						? {
								[decodeURIComponent(key)]:
									decodeURIComponent(value),
						  }
						: undefined;
				})
				.filter(pair => pair !== undefined) ?? []),
		),
	};
};

export type UrlParams = { [key: string]: string | number };

export const matchUrl = (
	input: string,
	templateUrl: URLPart[],
): [Query, UrlParams] | undefined => {
	const inputUrl = breakUpUrl(input);

	const params: UrlParams = {};

	for (let i = 0; i < templateUrl.length; ++i) {
		const inputPart = inputUrl.path[i];
		if (inputPart === undefined) return undefined;
		const templatePart = templateUrl[i];

		if (templatePart.type === PartType.REST) {
			break;
		} else if (templatePart.type === PartType.ANY) {
			continue;
		} else if (templatePart.type === PartType.MATCH) {
			if (templatePart.value !== inputPart.toLowerCase())
				return undefined;
		} else if (templatePart.type === PartType.NUMBER) {
			const num = Number.parseInt(inputPart);
			if (isNaN(num)) {
				return undefined;
			} else {
				params[templatePart.value] = num;
			}
		} else if (templatePart.type === PartType.STRING) {
			params[templatePart.value] = inputPart;
		}
	}

	return [inputUrl.query, params];
};
