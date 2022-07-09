import * as react from 'react';

export enum ResultType {
	HOMONYM,
	CARD,
	LATEST,
	RANDOM,
	NONE,
}
export const resultTypes = () =>
	[
		ResultType.HOMONYM,
		ResultType.CARD,
		ResultType.LATEST,
		ResultType.RANDOM,
		ResultType.NONE,
	] as const;
export const resultTypePaths = [
	'cards/homonym/:id',
	'cards/card/:id',
	'cards/latest',
	'cards/random',
	'cards',
];

export type Part = {
	id: string;
	english: string;
	korean: string;
};

export enum SuggestionSpecial {
	ADD,
}

export type SearchSuggestion = {
	word: string;
	ids: number[];
	url: string;
	special?: SuggestionSpecial;
};

export type Highlights = { part: string; highlight: boolean }[];

export type HistoryEntry = { field: keyof Card; value: string | undefined };
export type EditHistory = HistoryEntry[];

export type Card = {
	id: number;
	word: string;
	part: string | undefined;
	definition: string;
	sentence: string | undefined;
	picture: string | undefined;
	date: Date;
	badges: string[];
};

export type Editing = {
	[key: string]: { initial: string | undefined; editing: boolean };
};

export type CardPostResponse = {
	url: string;
	word: string;
};

export type ErrorResonse = {
	error: string;
};

export type MessageResponse = {
	message: string;
};

export type Homonym = {
	id: number;
	cards: Card[];
};
