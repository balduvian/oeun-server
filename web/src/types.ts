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

export type DbParts = { [id: string]: Omit<Part, 'id'> };

export type Badge = {
	id: string;
	displayName: string;
	picture: string;
};

export enum SuggestionSpecial {
	ADD,
	HOME,
	NO_RESULTS,
}

export type SearchSuggestion = {
	word: string;
	numbers: number[];
	url: string;
	definitions: string[];
	special?: SuggestionSpecial;
};

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
	pictureURL: string;
	anki: boolean;
	badges: string[];
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
	collectionSize: CollectionSize;
};

export type Homonym = {
	id: number;
	cards: Card[];
};

export type Setter<T> = (value: T) => void;

export type CollectionSize = {
	size: number;
	addedToday: number;
	ankiToday: number;
	editedToday: number;
};

export type CardsState = {
	collectionSize: CollectionSize;
	cards: Card[];
};
