export enum ResultType {
	HOMONYM,
	CARD,
	LATEST,
	RANDOM,
	NONE,
}

export type Part = {
	id: string;
	english: string;
	korean: string;
};

export type Badge = {
	id: string;
	name: string;
	image: string;
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

export type HistoryEntry = { field: keyof Card; value: string };

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

export type UploadCard = {
	id: number | undefined;
	word: string;
	part: string | undefined;
	definition: string;
	sentence: string | undefined;
	picture: string | undefined;
	badges: string[];
};

export type EditingCard = {
	id: number | undefined;
	word: string;
	part: string;
	definition: string;
	sentence: string;
	picture: string;
};

export type CardPostResponse = {
	url: string;
	word: string;
};

export type ErrorResponse = {
	error: string;
};

export type MessageResponse = {
	message: string;
};

export type Homonym = {
	id: number;
	cards: Card[];
};

export type Setter<T> = (value: T) => void;
