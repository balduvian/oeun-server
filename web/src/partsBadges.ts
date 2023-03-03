import * as util from './util';
import { Badge, DbParts, Part } from './types';

const KEY_PARTS = 'parts';
const KEY_BADGES = 'badges';

const STALE_TIME = 2700000;

type CachedResource<R> = {
	cacheTime: number;
	resource: R;
};

/* general */

const parseCachedResource = <R>(data: string) => {
	try {
		const storageParts = JSON.parse(data);

		if (typeof storageParts !== 'object') return undefined;
		if (typeof storageParts.cacheTime !== 'number') return undefined;
		if (!Array.isArray(storageParts.resource)) return undefined;

		return storageParts as CachedResource<R>;
	} catch (err) {
		return undefined;
	}
};

const saveResource = <R>(key: string, resource: R) => {
	window.localStorage.setItem(
		key,
		JSON.stringify({
			cacheTime: Date.now(),
			resource,
		}),
	);
};

const getResource = <R>(
	key: string,
	fetchResource: () => Promise<R>,
): Promise<R> => {
	const storageData = window.localStorage.getItem(key);

	let cache =
		storageData !== null ? parseCachedResource<R>(storageData) : undefined;

	if (cache !== undefined && Date.now() - cache.cacheTime > STALE_TIME)
		cache = undefined;

	if (cache !== undefined) return Promise.resolve(cache.resource);

	return fetchResource().then(resource => {
		saveResource(key, resource);
		return resource;
	});
};

/* parts */

export const getParts = () =>
	getResource(KEY_PARTS, async (): Promise<Part[]> => {
		const parts = await util.getRequest<DbParts>('/api/parts');

		return Object.entries(parts).map(([id, part]) => ({
			id,
			...part,
		}));
	});

/* badges */

export const getBadges = () => util.getRequest<Badge[]>('/api/badges');
