export type Highlight = [string, boolean | number];

export const highlightString = (string: string): Highlight[] => {
	/* get indices of all the star markers */
	const indices: number[] = [];
	let start = 0;
	while (true) {
		const nextIndex = string.indexOf('**', start);
		if (nextIndex === -1) {
			break;
		} else {
			indices.push(nextIndex);
			start = nextIndex + 2;
		}
	}

	/* remove last fake index (no closing **) */
	if (indices.length % 2 == 1) {
		indices.pop();
	}

	/* don't need any processing */
	if (indices.length === 0) return [[string, false]];

	const ret: Highlight[] = [];

	/* for each pair of indices */
	for (let i = 0; i < indices.length / 2; ++i) {
		ret.push([
			string.substring(
				i === 0 ? 0 : indices[(i - 1) * 2 + 1] + 2,
				indices[i * 2],
			),
			false,
		]);
		ret.push([
			string.substring(indices[i * 2] + 2, indices[i * 2 + 1]),
			true,
		]);
	}
	/* part after last pair */
	ret.push([string.substring(indices[indices.length - 1] + 2), false]);

	return ret;
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
				false,
			]);

		stringParts.push([matched[0], idolIndex]);
		lastIndex = regex.lastIndex;
	} while (true);

	if (lastIndex < string.length)
		stringParts.push([string.substring(lastIndex), false]);

	return stringParts;
};

export const highlightThenKpopHighlight = (string: string) =>
	highlightString(string).flatMap(section =>
		section[1] === true ? [section] : kpopHighlightString(section[0]),
	);
