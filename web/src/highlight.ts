export enum HighlightType {
	NONE,
	TARGET,
	NAME,
	IDOL,
}
export type Highlight = [string, HighlightType, number];

enum TokenType {
	DASH,
	STAR,
}

type Token = string | TokenType;

const tokensPlaintext = {
	[TokenType.STAR]: '**',
	[TokenType.DASH]: '__',
} as const;
const tokensHighlightType = {
	[TokenType.STAR]: HighlightType.TARGET,
	[TokenType.DASH]: HighlightType.NAME,
} as const;

export const highlightString = (string: string): Highlight[] => {
	const highlightRegex = /\*\*|__/g;

	const tokens: Token[] = [];

	let lastIndex = 0;
	while (true) {
		const matched = highlightRegex.exec(string);
		if (matched === null) {
			tokens.push(string.substring(lastIndex));
			break;
		} else {
			if (matched.index > lastIndex)
				tokens.push(string.substring(lastIndex, matched.index));

			tokens.push(matched[0] === '**' ? TokenType.STAR : TokenType.DASH);
			lastIndex = highlightRegex.lastIndex;
		}
	}

	const highlights: Highlight[] = [];
	let tokenStack: Token[] = [];

	for (const token of tokens) {
		if (tokenStack.length === 0) {
			if (typeof token === 'string') {
				highlights.push([token, HighlightType.NONE, 0]);
			} else {
				tokenStack.push(token);
			}
		} else if (tokenStack.length === 1) {
			if (typeof token === 'string') {
				tokenStack.push(token);
			} else {
				highlights.push(
					[
						tokensPlaintext[tokenStack[0] as TokenType],
						HighlightType.NONE,
						0,
					],
					[tokensPlaintext[token], HighlightType.NONE, 0],
				);
				tokenStack = [];
			}
		} else {
			if (token === tokenStack[0]) {
				highlights.push([
					tokenStack[1] as string,
					tokensHighlightType[tokenStack[0] as TokenType],
					0,
				]);
				tokenStack = [];
			} else {
				highlights.push(
					[
						tokensPlaintext[tokenStack[0] as TokenType],
						HighlightType.NONE,
						0,
					],
					[tokenStack[1] as string, HighlightType.NONE, 0],
				);
				tokenStack = [token];
			}
		}
	}

	tokenStack.forEach(remainingToken => {
		if (typeof remainingToken === 'string') {
			highlights.push([remainingToken, HighlightType.NONE, 0]);
		} else {
			highlights.push([
				tokensPlaintext[remainingToken],
				HighlightType.NONE,
				0,
			]);
		}
	});

	return highlights;
};

export const IDOLS_NAMES = [
	'나연',
	'정연',
	'모모',
	'사나',
	'지효',
	'미나',
	'다현',
	'채영',
	'쯔위',
	'혜빈',
	'제인',
	'연우',
	'태하',
	'주이',
	'데이지',
	'아인',
	'나윤',
	'낸시',
	'닝닝',
	'카리나',
	'지젤',
	'윈터',
	'류진',
	'예지',
	'리아',
	'유나',
	'채령',
] as const;

export const findIdolMatched = (matched: RegExpExecArray): number => {
	for (let i = 1; i <= IDOLS_NAMES.length; ++i) {
		if (matched[i] !== undefined) {
			return i - 1;
		}
	}
	return -1;
};

export const kpopHighlightString = (string: string): Highlight[] => {
	const regex = RegExp(IDOLS_NAMES.map(name => `(${name})`).join('|'), 'g');

	const stringParts: Highlight[] = [];
	let lastIndex = 0;

	do {
		const startIndex = regex.lastIndex;
		const matched = regex.exec(string);
		if (matched === null) break;

		const idolIndex = findIdolMatched(matched);

		if (matched.index > startIndex)
			stringParts.push([
				string.substring(startIndex, matched.index),
				HighlightType.NONE,
				0,
			]);

		stringParts.push([matched[0], HighlightType.IDOL, idolIndex]);
		lastIndex = regex.lastIndex;
	} while (true);

	if (lastIndex < string.length)
		stringParts.push([string.substring(lastIndex), HighlightType.NONE, 0]);

	return stringParts;
};

export const highlightThenKpopHighlight = (string: string) =>
	highlightString(string).flatMap(section =>
		section[1] === HighlightType.NONE
			? kpopHighlightString(section[0])
			: [section],
	);
