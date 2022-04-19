export type Part = {
	id: string;
	english: string;
	korean: string;
};

export type SearchSuggestion = {
	word: string;
	id: number;
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

export type NewField = {
	value: string | undefined;
	nullable: boolean;
	error: boolean;
};

export type NewCard = {
	word: NewField;
	part: NewField;
	definition: NewField;
	sentence: NewField;
	picture: NewField;
};

export enum Views {
	EDIT_CARD,
	NEW_CARD,
	DICTIONARY,
}
