import { useState, useRef } from 'react';
import { createGo, Go, Nav } from '../go';
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
	const isCommand = query.startsWith('!');
	const isNumberSearch = query.startsWith('#');

	/* add the create link */
	const firstResult = results[0] as SearchSuggestion | undefined;
	if (
		!isCommand &&
		!isNumberSearch &&
		(firstResult === undefined || firstResult.word !== query)
	)
		results.splice(0, 0, {
			word: query,
			numbers: [],
			url: `/edit?word=${query}`,
			definitions: [],
			special: SuggestionSpecial.ADD,
		});

	/* placeholder for no number search results */
	if (isNumberSearch && firstResult === undefined) {
		results.push({
			word: '',
			numbers: [],
			url: '',
			definitions: [`No cards for ${query}`],
			special: SuggestionSpecial.NO_RESULTS,
		});
	}

	/* placeholder for no command results */
	if (isCommand && firstResult === undefined) {
		results.push({
			word: '',
			numbers: [],
			url: '',
			definitions: [`No commands matching ${query}`],
			special: SuggestionSpecial.NO_RESULTS,
		});
	}

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
					definitions: [],
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
	nav: Nav;
};

const Header = ({ searchValue, setSearchValue, nav }: Props) => {
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

	const executeSuggestion = (suggestion: SearchSuggestion | undefined) => {
		inputRef.current?.blur();

		if (suggestion?.special === SuggestionSpecial.NO_RESULTS) {
			setHide();
		} else if (suggestion?.special === SuggestionSpecial.ADD) {
			setClear(suggestion.word);
			nav.goTo(createGo(suggestion.url));
		} else if (
			suggestion?.special === SuggestionSpecial.HOME ||
			suggestion === undefined
		) {
			setClear('');
			nav.goTo(createGo('/cards'));
		} else {
			setClear(suggestion.word);
			nav.goTo(createGo(suggestion.url));
		}
	};

	return (
		<div className="header">
			<WindowEvent
				eventName="keydown"
				callback={event => {
					if (event.code === 'KeyF' && event.ctrlKey) {
						event.preventDefault();
						inputRef.current?.focus();
					}
				}}
			/>
			<div className="search-container">
				<input
					className="search"
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
										executeSuggestion(
											newState.suggestions[
												newState.selection
											],
										);
								});
							} else {
								executeSuggestion(
									state.suggestions[state.selection],
								);
							}
						}
					}}
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
				{!state.shown ? null : (
					<div className="search-suggestions">
						{state.state === ResultState.ERROR ? (
							<div className="search-suggestion error">
								Something went wrong...
							</div>
						) : (
							state.suggestions.map(
								(
									{ word, numbers, special, definitions },
									i,
								) => (
									<div
										className={`search-suggestion ${
											i === state.selection
												? 'selected'
												: ''
										} ${
											special === SuggestionSpecial.ADD
												? 'add'
												: ''
										}`}
										key={word}
									>
										{special === SuggestionSpecial.ADD ? (
											<div className="suggestion-special-box">
												+
											</div>
										) : special ===
										  SuggestionSpecial.HOME ? (
											<div className="suggestion-special-box">
												⌂
											</div>
										) : (
											<div className="suggestion-special-box" />
										)}
										<div className="suggestion-word">
											{word}
										</div>
										<div className="suggestion-definitions">
											{definitions.join(', ')}
										</div>
										<div className="suggestion-id">
											{numbers.join(' ')}
										</div>
									</div>
								),
							)
						)}
					</div>
				)}
			</div>
		</div>
	);
};

export default Header;
