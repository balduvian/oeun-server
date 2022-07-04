import * as reactDom from 'react-dom/client';
import { BrowserRouter, Outlet, Route, useRoutes } from 'react-router-dom';
import { useState } from 'react';
import CardsPage from './cardsPage';
import { NewPage } from './newPage';
import { resultTypePaths, resultTypes } from './types';
import App from './app';

const Router = () => {
	const [searchValue, setSearchValue] = useState<string>('');

	return useRoutes([
		{
			path: '/',
			element: (
				<App
					searchValue={searchValue}
					setSearchValue={setSearchValue}
				/>
			),
			children: [
				{
					path: 'cards/',
					element: <Outlet />,
					children: resultTypes().map(resultType => ({
						path: resultTypePaths[resultType],
						element: <CardsPage mode={resultType} />,
					})),
				},
				{
					path: 'new',
					element: <NewPage setSearchValue={setSearchValue} />,
				},
			],
		},
	]);
};

const root = reactDom.createRoot(document.getElementById('root')!);
root.render(
	<BrowserRouter>
		<Router />
	</BrowserRouter>,
);