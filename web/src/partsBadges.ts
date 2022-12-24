import * as util from './util';
import { Part } from './types';

const KEY_PARTS = 'parts';
const STALE_TIME = 2700000;

type StorageParts = {
	cacheTime: number;
	parts: Part[];
};

/**
 * @returns either a value or a promise depending on if it can be fast fetched
 */
export const getParts = (
	setParts: (parts: Part[]) => void,
	setError: (error: boolean) => void,
) => {
	const data = window.localStorage.getItem(KEY_PARTS);

	let retrievedParts: StorageParts | undefined;

	retrievedParts = data !== null ? parseStorageParts(data) : undefined;
	if (
		retrievedParts !== undefined &&
		Date.now() - retrievedParts.cacheTime > STALE_TIME
	)
		retrievedParts = undefined;

	if (retrievedParts !== undefined) {
		setParts(retrievedParts.parts);
	} else {
		return fetchParts()
			.then(fetchedParts => {
				saveParts(fetchedParts);
				setParts(fetchedParts);
			})
			.catch(() => setError(true));
	}
};

const parseStorageParts = (data: string) => {
	try {
		const storageParts = JSON.parse(data);

		if (typeof storageParts !== 'object') return undefined;
		if (typeof storageParts.cacheTime !== 'number') return undefined;
		if (!Array.isArray(storageParts.parts)) return undefined;

		return storageParts as StorageParts;
	} catch (err) {
		return undefined;
	}
};

const fetchParts = async (): Promise<Part[]> => {
	const parts = await util.getRequest<{
		[key: string]: { english: string; korean: string; keybind: string };
	}>('/api/parts');

	return Object.keys(parts).map(partName => ({
		id: partName,
		...parts[partName],
	}));
};

const saveParts = (parts: Part[]) => {
	window.localStorage.setItem(
		KEY_PARTS,
		JSON.stringify({
			cacheTime: Date.now(),
			parts: parts,
		}),
	);
};
