import { getRequest, patchRequest } from './util';

export type Settings = {
	deckName: string;
	modelName: string;
};

export const dummySettings = (): Settings => ({ deckName: '', modelName: '' });

export const pullSettings = () => getRequest<Settings>('/api/settings');

export const pushSettings = (settings: Partial<Settings>) =>
	patchRequest('/api/settings', settings);
