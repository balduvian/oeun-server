import { useState, useEffect } from 'react';
import { matchUrl, Query, UrlParams, URLPart } from './url';
import { createGo, Go, Nav } from './go';

export type Route = {
	url: URLPart[];
	element: (nav: Nav) => JSX.Element | null;
	onGo: (nav: Nav, query: Query, params: UrlParams) => void;
};

type RouteResult = { query: Query; params: UrlParams; routeIndex: number };

export type RouterProps = {
	routes: Route[];
};

type Router = {
	nav: Nav;
	getElement: () => JSX.Element;
};

const findMatchingRoute = (
	url: string,
	routes: Route[],
): RouteResult | undefined => {
	for (let i = 0; i < routes.length; ++i) {
		const result = matchUrl(url, routes[i].url);
		if (result !== undefined) {
			return { query: result[0], params: result[1], routeIndex: i };
		}
	}
	return undefined;
};

export const useRouter = (routes: Route[]): Router => {
	const [routeResult, setRouteResult] = useState<RouteResult | undefined>(
		undefined,
	);
	const [error, setError] = useState<boolean>(false);

	useEffect(() => {
		goTo(createGo(window.location.pathname));
	}, []);

	let nav: Nav;

	const goTo = (go: Go) => {
		const url = go.url;
		const result = findMatchingRoute(url, routes);

		if (result !== undefined) {
			routes[result.routeIndex].onGo(nav, result.query, result.params);
		}

		window.history.pushState({}, '', window.location.origin + url);
		setRouteResult(result);
	};

	nav = { error, setError, goTo };

	return {
		nav,
		getElement: () => {
			if (error)
				return (
					<div className="blank-holder">
						<p>An error occurred</p>
					</div>
				);

			if (routeResult === undefined)
				return (
					<div className="blank-holder">
						<p>404</p>
					</div>
				);

			return (
				routes[routeResult.routeIndex].element({
					error,
					setError,
					goTo,
				}) ?? (
					<div className="blank-holder">
						<p>Loading...</p>
					</div>
				)
			);
		},
	};
};
