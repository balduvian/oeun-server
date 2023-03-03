import * as reactDom from 'react-dom/client';
import { useEffect, useState } from 'react';
import Header from './component/header';
import { ToastHolder, warn } from './toast';
import { Footer } from './component/footer';
import {
	Badge,
	Card,
	CollectionSize,
	EditingCard,
	Part,
	ResultType,
} from './types';
import { Route, useRouter } from './router';
import { intOrUndefined } from './util';
import BadgesPage from './page/badgesPage';
import CardsPage, { onGoCards } from './page/cardsPage';
import EditPage, { convertToPictureURL } from './page/editPage';
import SettingsPage from './page/settingsPage';
import { getBadges, getParts } from './partsBadges';
import {
	Settings,
	blankSettings,
	pullSettings,
	pushSettings,
} from './settings';
import { toTemplateURL } from './url';
import { getRequest } from './util';

const getCollectionSize = () =>
	getRequest<CollectionSize>('/api/collection/size');

const CARD_PAGE_URLS = [
	[ResultType.HOMONYM, toTemplateURL('/cards/homonym/#id')],
	[ResultType.CARD, toTemplateURL('/cards/card/#id')],
	[ResultType.LATEST, toTemplateURL('/cards/latest')],
	[ResultType.RANDOM, toTemplateURL('/cards/random')],
	[ResultType.NONE, toTemplateURL('/cards')],
	[ResultType.NONE, toTemplateURL('/')],
] as const;

const EDIT_PAGE_URL = toTemplateURL('/edit');

const BADGE_PAGE_URL = toTemplateURL('/badges');

const SETTINGS_PAGE_URL = toTemplateURL('/settings');

const App = () => {
	const [searchValue, setSearchValue] = useState('');
	const [parts, setParts] = useState<Part[]>([]);
	const [badges, setBadges] = useState<Badge[]>([]);
	const [settings, setSettings] = useState<Settings | undefined>(undefined);
	const [cards, setCards] = useState<Card[] | undefined>(undefined);
	const [collectionSize, setCollectionSize] = useState<
		CollectionSize | undefined
	>(undefined);
	const [editCard, setEditCard] = useState<EditingCard | undefined>(
		undefined,
	);

	const mergeSettings = (newSettings: Partial<Settings>) => {
		setSettings(settings => ({
			...blankSettings(),
			...(settings ?? {}),
			...newSettings,
		}));
	};

	useEffect(() => {
		pullSettings().then(settings => mergeSettings(settings));
	}, []);

	const routes: Route[] = [
		{
			url: EDIT_PAGE_URL,
			element: nav =>
				editCard === undefined ? null : (
					<EditPage
						setSearchValue={setSearchValue}
						nav={nav}
						parts={parts}
						badges={badges}
						card={editCard}
						setCard={setEditCard}
					/>
				),
			onGo: (_, query) => {
				const card: EditingCard = {
					id: intOrUndefined(query.id),
					word: query.word ?? '',
					part: query.part ?? '',
					definition: query.definition ?? '',
					sentence: query.sentence ?? '',
					pictureURL:
						query.picture === undefined
							? ''
							: convertToPictureURL(query.picture),
					anki: query.anki === 'true',
					badges:
						query.badges === undefined
							? []
							: JSON.parse(query.badges),
				};

				getCollectionSize().then(setCollectionSize);
				setEditCard(card);
				getParts()
					.then(setParts)
					.catch(() => warn('Could not get parts'));
				getBadges()
					.then(setBadges)
					.catch(() => warn('Could not get badges'));

				const extensionId = settings?.extensionId ?? null;

				if (extensionId !== null && card.pictureURL === '') {
					chrome.runtime.sendMessage(
						extensionId,
						{ name: 'takeScreenshot', value: undefined },
						async response => {
							const base64 = response.value as string | undefined;
							if (base64 === undefined) {
								console.warn('Ebetshot failed to connect');
								return;
							}

							setEditCard(card =>
								card === undefined
									? undefined
									: { ...card, pictureURL: base64 },
							);
						},
					);
				}
			},
		},
		{
			url: BADGE_PAGE_URL,
			element: () => <BadgesPage badges={badges} setBadges={setBadges} />,
			onGo: () => {
				getCollectionSize().then(setCollectionSize);
				getBadges()
					.then(setBadges)
					.catch(() => warn('Could not get badges'));
			},
		},
		{
			url: SETTINGS_PAGE_URL,
			element: () =>
				settings === undefined ? null : (
					<SettingsPage
						settings={settings}
						setSettings={newSettings => {
							pushSettings(newSettings);
							setSettings(settings => ({
								...blankSettings(),
								...(settings ?? {}),
								...newSettings,
							}));
						}}
					/>
				),
			onGo: () => {
				pullSettings().then(settings => setSettings(settings));
				getCollectionSize().then(setCollectionSize);
			},
		},
		...CARD_PAGE_URLS.map(
			([resultType, url]): Route => ({
				url: url,
				element: nav =>
					cards === undefined || settings === undefined ? null : (
						<CardsPage
							nav={nav}
							cards={cards}
							setCards={setCards}
							collectionSize={collectionSize}
							setCollectionSize={setCollectionSize}
							parts={parts}
							badges={badges}
							settings={settings}
						/>
					),
				onGo: (nav, _query, params) =>
					onGoCards(
						params['id'] as number,
						resultType,
						setParts,
						nav.setError,
						setCards,
						setCollectionSize,
					),
			}),
		),
	];

	const router = useRouter(routes);

	return (
		<div className="app-container">
			<ToastHolder />
			<Header
				searchValue={searchValue}
				setSearchValue={setSearchValue}
				nav={router.nav}
			/>
			<div className="page-content">{router.getElement()}</div>
			<Footer collectionSize={collectionSize} />
		</div>
	);
};

const root = reactDom.createRoot(document.getElementById('root')!);
root.render(<App />);
