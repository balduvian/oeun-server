import * as react from 'react';

export type Part = {
	id: string;
	english: string;
	korean: string;
};

export type SearchSuggestion = {
	word: string;
	id: number;
	url: string;
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

export type NewField<T> = {
	value: string | undefined;
	nullable: boolean;
	error: boolean;
	ref: react.RefObject<T>;
};

export type NewCard = {
	word: NewField<HTMLInputElement>;
	part: NewField<HTMLSelectElement>;
	definition: NewField<HTMLInputElement>;
	sentence: NewField<HTMLInputElement>;
	picture: NewField<HTMLInputElement>;
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
