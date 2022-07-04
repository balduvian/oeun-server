import { useState, useRef } from 'react';
import { SearchSuggestion } from './types';
import * as util from './util';
import KorInput from './korInput';
import { useNavigate } from 'react-router-dom';

enum ResultState {
	GOOD,
	NO_RESULTS,
	ERROR,
}

export type Props = {
	searchValue: string;
	setSearchValue: (value: string) => void;
};

export type State = {
	suggestions: SearchSuggestion[];
	error: boolean;
	noResults: boolean;
	selection: number;
};

const SearchBox = ({ searchValue, setSearchValue }: Props) => {
	const waitingOnInput = useRef(false);
	const typingEventNo = useRef(0);

	const [suggestions, setSuggestions] = useState<
		SearchSuggestion[] | undefined
	>(undefined);
	const [resultState, setResultState] = useState<ResultState>(
		ResultState.GOOD,
	);
	const [selection, setSelection] = useState<number>(0);

	const navigate = useNavigate();

	const stateSearchError = () => {
		setSuggestions([]);
		setResultState(ResultState.ERROR);
		setSelection(0);
	};

	const clear = (searchValue?: string) => {
		setSuggestions(undefined);
		setResultState(ResultState.GOOD);
		setSelection(0);
		if (searchValue !== undefined) setSearchValue(searchValue);
	};

	const setResults = (results: SearchSuggestion[]) => {
		setSuggestions(results);
		setResultState(
			results.length === 0 ? ResultState.NO_RESULTS : ResultState.GOOD,
		);
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
				.then(([, data]) => (setResults(data), data))
				.catch(() => (stateSearchError(), undefined));
		}
	};

	const onSearch = (suggestion: SearchSuggestion | undefined) => {
		(document.activeElement as HTMLElement | null)?.blur();
		if (suggestion === undefined) {
			clear('');
			navigate('/cards');
		} else {
			clear(suggestion.word);
			navigate(suggestion.url);
		}
	};

	return (
		<div id="immr-search-area">
			<div className="search-grid">
				<KorInput
					smart={false}
					onKeyDown={event => {
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
					inputProps={{
						id: 'immr-search',
						value: searchValue,
						onFocus: event => {
							const search = event.currentTarget;
							search.selectionStart = 0;
							search.selectionEnd = search.value.length;
							makeSearch(search.value);
						},
						onBlur: () => {
							clear();
						},
						onInput: async event => {
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
						},
					}}
				/>
				<button
					id="add-button"
					onClick={() => {
						setSearchValue('');
						navigate('/new');
					}}
				>
					+
				</button>
			</div>
			{suggestions === undefined ? null : (
				<div id="immr-search-suggestions">
					{resultState === ResultState.ERROR ? (
						<div className="immr-search-suggestion error">
							Something went wrong...
						</div>
					) : resultState === ResultState.NO_RESULTS ? (
						<div className="immr-search-suggestion error">
							No results
						</div>
					) : (
						suggestions.map(({ word, ids }, i) => (
							<div
								className={`immr-search-suggestion ${
									i === selection ? 'selected' : ''
								}`}
								key={word}
							>
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
