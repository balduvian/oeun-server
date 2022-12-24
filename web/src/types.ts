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
	keybind: string;
};

export type Badge = {
	id: string;
	name: string;
	image: string;
};

export enum SuggestionSpecial {
	ADD,
	HOME,
}

export type SearchSuggestion = {
	word: string;
	numbers: number[];
	url: string;
	special?: SuggestionSpecial;
};

export type Highlights = { part: string; highlight: boolean }[];

export type HistoryEntry = { field: keyof Card; value: string };

export type AnkiData = {
	id: number;
	added: string;
};

export type Card = {
	id: number;
	word: string;
	part: string | undefined;
	definition: string;
	sentence: string | undefined;
	picture: string | undefined;
	badges: string[];
	anki: AnkiData | undefined;
};

export type UploadCard = {
	id: number | undefined;
	word: string;
	part: string | undefined;
	definition: string;
	sentence: string | undefined;
	picture: string | undefined;
	badges: string[];
	anki: boolean;
};

export type EditingCard = {
	id: number | undefined;
	word: string;
	part: string;
	definition: string;
	sentence: string;
	picture: string;
	anki: boolean;
};

export type CardPutResponse = {
	url: string;
	word: string;
	warnings: string[];
};

export type ErrorResponse = {
	error: string;
};

export type MessageResponse = {
	message: string;
};

export type DeleteResponse = {
	warnings: string[];
};

export type Homonym = {
	id: number;
	cards: Card[];
};

export type Setter<T> = (value: T) => void;
