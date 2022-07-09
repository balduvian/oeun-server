import * as reactDom from 'react-dom/client';
import { BrowserRouter, useRoutes } from 'react-router-dom';
import { useState } from 'react';
import CardsPage from './cardsPage';
import { NewPage } from './newPage';
import { resultTypePaths, resultTypes } from './types';
import App from './app';

const Router = () => {
	const [searchValue, setSearchValue] = useState('');
	const [word, setWord] = useState('');

	return useRoutes([
		{
			path: '/',
			element: (
				<App
					searchValue={searchValue}
					setSearchValue={setSearchValue}
					setWord={setWord}
				/>
			),
			children: [
				...resultTypes().map(resultType => ({
					path: resultTypePaths[resultType],
					element: <CardsPage mode={resultType} setWord={setWord} />,
				})),
				{
					path: 'new',
					element: (
						<NewPage
							setSearchValue={setSearchValue}
							word={word}
							setWord={setWord}
						/>
					),
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
