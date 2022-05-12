import * as util from './util';
import { Part } from './types';

const KEY_PARTS = 'parts';
const STALE_TIME = 2700000;

type StorageParts = {
	cacheTime: number;
	parts: Part[];
};

/**
 * @returns either a value or a promise depending on if it can be fast fetched or not
 */
export const getParts = () => {
	const data = window.localStorage.getItem(KEY_PARTS);

	let retrievedParts: StorageParts | undefined;

	retrievedParts = data !== null ? parseStorageParts(data) : undefined;
	if (retrievedParts !== undefined && Date.now() - retrievedParts.cacheTime > STALE_TIME) retrievedParts = undefined;

	if (retrievedParts !== undefined) {
		console.log(`got parts with time: ${retrievedParts.cacheTime} | vs ${Date.now()}`);
		return retrievedParts.parts;
	} else {
		return fetchParts().then(fetchedParts => {
			if (fetchedParts === undefined) {
				return [];
			} else {
				console.log('Fetched new parts');
				saveParts(fetchedParts);
				return fetchedParts;
			}
		});
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

const fetchParts = async (): Promise<Part[] | undefined> => {
	const [code, data] = await util.getRequest<any>('/api/parts');
	if (!util.isGood(code, data)) return undefined;

	return Object.keys(data).map(partName => ({
		id: partName,
		english: data[partName].english as string,
		korean: data[partName].korean as string,
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
