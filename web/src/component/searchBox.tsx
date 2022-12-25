import { useState, useRef } from 'react';
import { createGo, Go } from '../go';
import { composingEvents, isComposing } from '../korInput';
import { SearchSuggestion, SuggestionSpecial } from '../types';
import * as util from '../util';
import WindowEvent from '../windowEvent';

enum ResultState {
	GOOD,
	ERROR,
}

type State = {
	suggestions: SearchSuggestion[];
	state: ResultState;
	selection: number;
	shown: boolean;
};
type StateMayShown = Omit<State, 'shown'> & { shown?: boolean };

const stateSearchError = (): State => ({
	suggestions: [],
	state: ResultState.ERROR,
	selection: 0,
	shown: true,
});

const stateResults = (
	{ selection }: State,
	query: string,
	results: SearchSuggestion[],
): StateMayShown => {
	/* add the create link */
	const firstResult = results[0] as SearchSuggestion | undefined;
	if (
		!query.startsWith('!') &&
		!query.startsWith('#') &&
		(firstResult === undefined || firstResult.word !== query)
	)
		results.splice(0, 0, {
			word: query,
			numbers: [],
			url: `/edit?word=${query}`,
			special: SuggestionSpecial.ADD,
		});

	return {
		suggestions: results,
		state: ResultState.GOOD,
		selection: util.coerceIn(selection, 0, results.length - 1),
	};
};

const makeSearch = async (
	state: State,
	query: string,
): Promise<StateMayShown> => {
	/* don't need to ask for empty search */
	if (query.length === 0)
		return {
			suggestions: [
				{
					word: 'Home',
					numbers: [],
					url: '/cards',
					special: SuggestionSpecial.HOME,
				},
			],
			state: ResultState.GOOD,
			selection: 0,
		};
	else
		try {
			const suggestions = await util.getRequest<SearchSuggestion[]>(
				`/api/collection/search/${encodeURIComponent(query)}/10`,
			);

			return stateResults(state, query, suggestions);
		} catch {
			return stateSearchError();
		}
};

type Props = {
	searchValue: string;
	setSearchValue: (value: string) => void;
	goTo: (go: Go) => void;
};

const SearchBox = ({ searchValue, setSearchValue, goTo }: Props) => {
	const inputRef = useRef<HTMLInputElement>(null);
	const waitingOnInput = useRef(false);
	const typingEventNo = useRef(0);

	const [state, setState] = useState<State>({
		suggestions: [],
		state: ResultState.GOOD,
		selection: 0,
		shown: false,
	});

	const setClear = (searchValue?: string) => {
		setState({
			suggestions: [],
			state: ResultState.GOOD,
			selection: 0,
			shown: false,
		});
		if (searchValue !== undefined) setSearchValue(searchValue);
	};

	const setShown = () =>
		setState(state => ({
			...state,
			shown: true,
		}));

	const setHide = () => {
		setState(state => ({ ...state, shown: false }));
	};

	const setSearch = (suggestion: SearchSuggestion | undefined) => {
		inputRef.current?.blur();

		if (suggestion?.special === SuggestionSpecial.ADD) {
			setClear(suggestion.word);
			goTo(createGo(suggestion.url));
		} else if (
			suggestion?.special === SuggestionSpecial.HOME ||
			suggestion === undefined
		) {
			setClear('');
			goTo(createGo('/cards'));
		} else {
			setClear(suggestion.word);
			goTo(createGo(suggestion.url));
		}
	};

	return (
		<div id="immr-search-area">
			<WindowEvent
				eventName="keydown"
				callback={event => {
					if (event.code === 'KeyF' && event.ctrlKey) {
						event.preventDefault();
						inputRef.current?.focus();
					}
				}}
			/>
			<div className="search-grid">
				<input
					ref={inputRef}
					{...composingEvents}
					onKeyDown={event => {
						if (isComposing(event)) return;
						if (state.suggestions === undefined) return;

						if (event.code === 'ArrowDown') {
							event.preventDefault();
							setState(({ suggestions, selection, ...rest }) => ({
								suggestions,
								selection: Math.min(
									state.selection + 1,
									suggestions.length - 1,
								),
								...rest,
							}));
						} else if (event.code === 'ArrowUp') {
							event.preventDefault();
							setState(({ selection, ...rest }) => ({
								selection: Math.max(state.selection - 1, 0),
								...rest,
							}));
						} else if (event.code === 'Escape') {
							event.preventDefault();
							event.currentTarget.blur();
						} else if (event.code === 'Enter') {
							event.preventDefault();
							const value = event.currentTarget.value;

							if (waitingOnInput.current) {
								++typingEventNo.current;

								makeSearch(state, value).then(newState => {
									if (newState.suggestions.length === 0)
										setState(({ shown }) => ({
											shown,
											...newState,
										}));
									else
										setSearch(
											newState.suggestions[
												newState.selection
											],
										);
								});
							} else {
								setSearch(state.suggestions[state.selection]);
							}
						}
					}}
					id="immr-search"
					value={searchValue}
					onFocus={event => {
						const search = event.currentTarget;
						search.selectionStart = 0;
						search.selectionEnd = search.value.length;
						if (state.suggestions.length === 0) {
							setShown();
							makeSearch(state, searchValue).then(newState =>
								setState(({ shown }) => ({
									shown,
									...newState,
								})),
							);
						} else setShown();
					}}
					onBlur={() => setHide()}
					onInput={async event => {
						const currentValue = event.currentTarget.value;
						if (currentValue === searchValue) return;

						setSearchValue(currentValue);

						const thisNo = ++typingEventNo.current;
						const wasWaiting = waitingOnInput.current;
						waitingOnInput.current = true;

						const query = event.currentTarget.value;

						/* save search calls */
						if (query.length > 0 && !wasWaiting)
							await util.wait(100);
						if (typingEventNo.current != thisNo) return;
						waitingOnInput.current = false;

						makeSearch(state, query).then(newState =>
							setState(({ shown }) => ({
								shown,
								...newState,
							})),
						);
					}}
				/>
			</div>
			{!state.shown ? null : (
				<div id="immr-search-suggestions">
					{state.state === ResultState.ERROR ? (
						<div className="immr-search-suggestion error">
							Something went wrong...
						</div>
					) : (
						state.suggestions.map(
							({ word, numbers, special }, i) => (
								<div
									className={`immr-search-suggestion ${
										i === state.selection ? 'selected' : ''
									} ${
										special === SuggestionSpecial.ADD
											? 'add'
											: ''
									}`}
									key={word}
								>
									{special === SuggestionSpecial.ADD ? (
										<div className="add-plus">+</div>
									) : special === SuggestionSpecial.HOME ? (
										<div className="add-plus">H</div>
									) : null}
									{word}
									<div className="id">
										{numbers.join(' ')}
									</div>
								</div>
							),
						)
					)}
				</div>
			)}
		</div>
	);
};

export default SearchBox;
