import * as reactDom from 'react-dom/client';
import { useState } from 'react';
import CardsPage from './cardsPage';
import { NewPage } from './newPage';
import { resultTypePaths, resultTypes } from './types';
import App from './app';

type UrlParams = { [key: string]: number };

const matchUrl = (url: string, to: string) => {
	if (to === '*') return {};

	const urlParts = url.split('/');
	const toParts = to.split('/');

	const params: UrlParams = {};

	if (urlParts.length !== toParts.length) return undefined;

	for (let i = 0; i < urlParts.length; ++i) {
		const urlPart = urlParts[i].toLocaleLowerCase();
		const toPart = toParts[i].toLocaleLowerCase();

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
	const [route, setRoute] = useState('/');
	const [searchValue, setSearchValue] = useState('');
	const [word, setWord] = useState('');

	const routes: {
		url: string;
		element: (params: UrlParams) => JSX.Element;
	}[] = [
		{
			url: '/new',
			element: () => (
				<NewPage
					setSearchValue={setSearchValue}
					word={word}
					setWord={setWord}
					setRoute={setRoute}
				/>
			),
		},
		...resultTypes().map(resultType => ({
			url: resultTypePaths[resultType],
			element: (params: UrlParams) => (
				<CardsPage
					mode={resultType}
					id={params['id']}
					setWord={setWord}
					setRoute={setRoute}
				/>
			),
		})),
	];

	const routeToElement = (route: string) => {
		for (const { url, element } of routes) {
			const params = matchUrl(route, url);
			if (params !== undefined) {
				return element(params);
			}
		}
		return null;
	};

	return (
		<App
			searchValue={searchValue}
			setSearchValue={setSearchValue}
			setWord={setWord}
			setRoute={setRoute}
		>
			{routeToElement(route)}
		</App>
	);
};

const root = reactDom.createRoot(document.getElementById('root')!);
root.render(<Router />);
