import { useState, useRef } from 'react';
import { composingEvents, isComposing } from './korInput';
import { SearchSuggestion, SuggestionSpecial } from './types';
import * as util from './util';

enum ResultState {
	GOOD,
	ERROR,
}

type Props = {
	searchValue: string;
	setSearchValue: (value: string) => void;
	setWord: (word: string) => void;
	goTo: (url: string) => void;
};

const SearchBox = ({ searchValue, setSearchValue, setWord, goTo }: Props) => {
	const waitingOnInput = useRef(false);
	const typingEventNo = useRef(0);

	const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
	const [resultState, setResultState] = useState<ResultState>(
		ResultState.GOOD,
	);
	const [selection, setSelection] = useState<number>(0);

	const stateSearchError = () => {
		setSuggestions([]);
		setResultState(ResultState.ERROR);
		setSelection(0);
	};

	const clear = (searchValue?: string) => {
		setSuggestions([]);
		setResultState(ResultState.GOOD);
		setSelection(0);
		if (searchValue !== undefined) setSearchValue(searchValue);
	};

	const setResults = (query: string, results: SearchSuggestion[]) => {
		/* add the create link */
		const firstResult = results[0] as SearchSuggestion | undefined;
		if (
			!query.startsWith('!') &&
			!query.startsWith('#') &&
			(firstResult === undefined || firstResult.word !== query)
		) {
			results.splice(0, 0, {
				word: query,
				ids: [],
				url: '/new',
				special: SuggestionSpecial.ADD,
			});
		}

		setSuggestions(results);
		setResultState(ResultState.GOOD);
		setSelection(util.coerceIn(selection, 0, results.length - 1));
	};

	const makeSearch = (query: string) => {
		if (query.length === 0) {
			/* don't need to ask for empty search */
			return Promise.resolve((clear(), []));
		} else {
			return util
				.getRequest<SearchSuggestion[]>(
					`/api/collection/search/${query.replaceAll('#', '%23')}/10`,
				)
				.then(([, data]) => (setResults(query, data), data))
				.catch(() => (stateSearchError(), undefined));
		}
	};

	const onSearch = (suggestion: SearchSuggestion | undefined) => {
		(document.activeElement as HTMLElement | null)?.blur();
		if (suggestion?.special === SuggestionSpecial.ADD) {
			clear(suggestion.word);
			setWord(suggestion.word);
			goTo('/new');
		} else if (suggestion === undefined) {
			clear('');
			goTo('/cards');
		} else {
			clear(suggestion.word);
			goTo(suggestion.url);
		}
	};

	return (
		<div id="immr-search-area">
			<div className="search-grid">
				<input
					{...composingEvents}
					onKeyDown={event => {
						if (isComposing(event)) return;
						if (suggestions === undefined) return;

						if (event.code === 'ArrowDown') {
							event.preventDefault();
							setSelection(
								Math.min(selection + 1, suggestions.length - 1),
							);
						} else if (event.code === 'ArrowUp') {
							event.preventDefault();
							setSelection(Math.max(selection - 1, 0));
						} else if (event.code === 'Escape') {
							event.preventDefault();
							event.currentTarget.blur();
						} else if (event.code === 'Enter') {
							event.preventDefault();
							const value = event.currentTarget.value;

							if (waitingOnInput.current) {
								++typingEventNo.current;

								makeSearch(value).then(suggestions => {
									if (suggestions !== undefined) {
										onSearch(suggestions[selection]);
									}
								});
							} else {
								onSearch(suggestions[selection]);
							}
						}
					}}
					id="immr-search"
					value={searchValue}
					onFocus={event => {
						const search = event.currentTarget;
						search.selectionStart = 0;
						search.selectionEnd = search.value.length;
						makeSearch(search.value);
					}}
					onBlur={() => {
						clear();
					}}
					onInput={async event => {
						const currentValue = event.currentTarget.value;
						if (currentValue === searchValue) return;

						setSearchValue(currentValue);

						const thisNo = ++typingEventNo.current;
						waitingOnInput.current = true;

						const query = event.currentTarget.value;

						/* save search calls */
						await util.wait(250);
						if (typingEventNo.current != thisNo) return;
						waitingOnInput.current = false;

						makeSearch(query);
					}}
				/>
			</div>
			{suggestions.length === 0 &&
			resultState === ResultState.GOOD ? null : (
				<div id="immr-search-suggestions">
					{resultState === ResultState.ERROR ? (
						<div className="immr-search-suggestion error">
							Something went wrong...
						</div>
					) : (
						suggestions.map(({ word, ids, special }, i) => (
							<div
								className={`immr-search-suggestion ${
									i === selection ? 'selected' : ''
								} ${
									special === SuggestionSpecial.ADD
										? 'add'
										: ''
								}`}
								key={word}
							>
								{special === SuggestionSpecial.ADD ? (
									<div className="add-plus">+</div>
								) : null}
								{word}
								<div className="id">{ids.join(' ')}</div>
							</div>
						))
					)}
				</div>
			)}
		</div>
	);
};

export default SearchBox;
