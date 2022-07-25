import * as reactDom from 'react-dom/client';
import { useEffect, useState } from 'react';
import CardsPage, { onGoCards } from './cardsPage';
import { NewPage } from './newPage';
import { Badge, Card, Part, ResultType } from './types';
import App from './app';
import BadgesPage from './badgesPage';
import { getParts } from './partsBadges';

type Route = {
	url: string;
	element: () => JSX.Element | null;
	onGo: (params: UrlParams) => void;
};
type UrlParams = { [key: string]: number };
type RouteResult = { params: UrlParams; routeIndex: number };

const matchUrl = (input: string, templateUrl: string) => {
	const inputParts = input.split('/');
	const templateParts = templateUrl.split('/');

	const params: UrlParams = {};

	if (inputParts.length !== templateParts.length) return undefined;

	for (let i = 0; i < inputParts.length; ++i) {
		const urlPart = inputParts[i].toLocaleLowerCase();
		const toPart = templateParts[i].toLocaleLowerCase();

		if (toPart.startsWith(':')) {
			const num = Number.parseInt(urlPart);
			if (isNaN(num)) {
				return undefined;
			} else {
				params[toPart.slice(1)] = num;
			}
		} else if (urlPart !== toPart) {
			return undefined;
		}
	}

	return params;
};

const Router = () => {
	const [routeResult, setRouteResult] = useState<RouteResult | undefined>(
		undefined,
	);
	const [searchValue, setSearchValue] = useState('');
	const [word, setWord] = useState('');
	const [parts, setParts] = useState<Part[]>([]);
	const [badges, setBadges] = useState<Badge[]>([]);
	const [cards, setCards] = useState<Card[] | undefined>(undefined);
	const [collectionSize, setCollectionSize] = useState<number>(0);
	const [error, setError] = useState<boolean>(false);

	const routes: Route[] = [
		{
			url: '/new',
			element: () => (
				<NewPage
					setSearchValue={setSearchValue}
					word={word}
					setWord={setWord}
					goTo={goTo}
					parts={parts}
					setError={setError}
				/>
			),
			onGo: () => {
				getParts(setParts, setError);
			},
		},
		{
			url: '/badges',
			element: () => <BadgesPage />,
			onGo: () => {},
		},
		...(
			[
				[ResultType.HOMONYM, '/cards/homonym/:id'],
				[ResultType.CARD, '/cards/card/:id'],
				[ResultType.LATEST, '/cards/latest'],
				[ResultType.RANDOM, '/cards/random'],
				[ResultType.NONE, '/cards'],
				[ResultType.NONE, '/'],
			] as const
		).map(([resultType, url]) => ({
			url: url,
			element: () =>
				cards === undefined ? null : (
					<CardsPage
						mode={resultType}
						setWord={setWord}
						goTo={goTo}
						cards={cards}
						setCards={setCards}
						word={word}
						collectionSize={collectionSize}
						parts={parts}
					/>
				),
			onGo: (params: UrlParams) =>
				onGoCards(
					params['id'],
					resultType,
					setParts,
					setError,
					setWord,
					setCards,
					setCollectionSize,
				),
		})),
	];

	const findMatchingRoute = (url: string): RouteResult | undefined => {
		for (let i = 0; i < routes.length; ++i) {
			const params = matchUrl(url, routes[i].url);
			if (params !== undefined) {
				return { params: params, routeIndex: i };
			}
		}
		return undefined;
	};

	const goTo = (url: string) => {
		const result = findMatchingRoute(url);
		setRouteResult(result);
		if (result !== undefined) routes[result.routeIndex].onGo(result.params);
		return undefined;
	};

	useEffect(() => {
		const url = window.location.pathname;
		goTo(url);
	}, []);

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
			setWord={setWord}
			goTo={goTo}
		>
			{getRouteElement()}
		</App>
	);
};

const root = reactDom.createRoot(document.getElementById('root')!);
root.render(<Router />);
