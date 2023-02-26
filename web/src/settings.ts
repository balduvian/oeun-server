import { getRequest, patchRequest } from './util';

export type Settings = {
	deckName: string | null;
	modelName: string | null;
	extensionId: string | null;
	dayCutoffHour: number | null;
};

export const blankSettings = (): Settings => ({
	deckName: null,
	modelName: null,
	extensionId: null,
	dayCutoffHour: null,
});

export const pullSettings = () => getRequest<Settings>('/api/settings');

export const pushSettings = (settings: Partial<Settings>) =>
	patchRequest('/api/settings', settings);
