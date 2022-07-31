import * as reactDom from 'react-dom/client';
import { useEffect, useState } from 'react';
import CardsPage, { onGoCards } from './cardsPage';
import { NewPage } from './editPage';
import {
	Badge,
	Card,
	EditingCard,
	HistoryEntry,
	Part,
	ResultType,
} from './types';
import App from './app';
import BadgesPage from './badgesPage';
import { getParts } from './partsBadges';
import { matchUrl, Query, toTemplateURL, UrlParams, URLPart } from './url';
import { intOrUndefined } from './util';
import { createGo, Go } from './go';

type Route = {
	url: URLPart[];
	element: () => JSX.Element | null;
	onGo: (query: Query, params: UrlParams) => void;
};

type RouteResult = { query: Query; params: UrlParams; routeIndex: number };

const Router = () => {
	const [routeResult, setRouteResult] = useState<RouteResult | undefined>(
		undefined,
	);
	const [searchValue, setSearchValue] = useState('');
	const [parts, setParts] = useState<Part[]>([]);
	const [badges, setBadges] = useState<Badge[]>([]);
	const [cards, setCards] = useState<Card[] | undefined>(undefined);
	const [collectionSize, setCollectionSize] = useState<number>(0);
	const [error, setError] = useState<boolean>(false);
	const [editCard, setEditCard] = useState<EditingCard | undefined>(
		undefined,
	);
	const [editHistory, setEditHistory] = useState<HistoryEntry[]>([]);

	useEffect(() => {
		const url = window.location.pathname;
		goTo(createGo(url));
	}, []);

	const routes: Route[] = [
		{
			url: toTemplateURL('/edit'),
			element: () =>
				editCard === undefined ? null : (
					<NewPage
						setSearchValue={setSearchValue}
						goTo={goTo}
						parts={parts}
						setError={setError}
						card={editCard}
						setCard={setEditCard}
						history={editHistory}
					/>
				),
			onGo: query => {
				const card: EditingCard = {
					id: intOrUndefined(query.id),
					word: query.word ?? '',
					part: query.part ?? '',
					definition: query.definition ?? '',
					sentence: query.sentence ?? '',
					picture: query.picture ?? '',
				};
				setEditCard(card);
				setEditHistory([]);
				getParts(setParts, setError);
			},
		},
		{
			url: toTemplateURL('/badges'),
			element: () => <BadgesPage />,
			onGo: () => {},
		},
		...(
			[
				[ResultType.HOMONYM, toTemplateURL('/cards/homonym/#id')],
				[ResultType.CARD, toTemplateURL('/cards/card/#id')],
				[ResultType.LATEST, toTemplateURL('/cards/latest')],
				[ResultType.RANDOM, toTemplateURL('/cards/random')],
				[ResultType.NONE, toTemplateURL('/cards')],
				[ResultType.NONE, toTemplateURL('/')],
			] as const
		).map(([resultType, url]) => ({
			url: url,
			element: () =>
				cards === undefined ? null : (
					<CardsPage
						goTo={goTo}
						cards={cards}
						setCards={setCards}
						collectionSize={collectionSize}
						parts={parts}
					/>
				),
			onGo: (_: Query, params: UrlParams) =>
				onGoCards(
					params['id'] as number,
					resultType,
					setParts,
					setError,
					setCards,
					setCollectionSize,
				),
		})),
	];

	const findMatchingRoute = (url: string): RouteResult | undefined => {
		for (let i = 0; i < routes.length; ++i) {
			const result = matchUrl(url, routes[i].url);
			if (result !== undefined) {
				return { query: result[0], params: result[1], routeIndex: i };
			}
		}
		return undefined;
	};

	const goTo = (go: Go) => {
		const url = go.url;
		const result = findMatchingRoute(url);

		if (result !== undefined) {
			routes[result.routeIndex].onGo(result.query, result.params);
		}

		window.history.pushState({}, '', window.location.origin + url);
		setRouteResult(result);
	};

	const getRouteElement = () => {
		if (error) {
			<div className="blank-holder">
				<p>An error occurred</p>
			</div>;
		}

		if (routeResult === undefined) {
			return (
				<div className="blank-holder">
					<p>404</p>
				</div>
			);
		}

		return (
			routes[routeResult.routeIndex].element() ?? (
				<div className="blank-holder">
					<p>Loading...</p>
				</div>
			)
		);
	};

	return (
		<App
			searchValue={searchValue}
			setSearchValue={setSearchValue}
			goTo={goTo}
		>
			{getRouteElement()}
		</App>
	);
};

const root = reactDom.createRoot(document.getElementById('root')!);
root.render(<Router />);
