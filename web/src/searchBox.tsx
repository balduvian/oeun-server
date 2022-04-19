import * as react from 'react';
import { SearchSuggestion } from './types';
import * as util from './util';
import * as shared from './shared';

let currentGoodTypingEventNo = 0;

export type Props = {
	searchValue: string;
	onSearch: (suggestion: SearchSuggestion) => void;
};

export type State = {
	suggestions: SearchSuggestion[];
	error: boolean;
	noResults: boolean;
	selection: number;
	searchValue: string;
};

export class SearchBox extends react.Component<Props, State> {
	searchRef: react.RefObject<HTMLInputElement>;

	constructor(props: Props) {
		super(props);
		this.state = {
			suggestions: [],
			error: false,
			noResults: false,
			selection: 0,
			searchValue: props.searchValue,
		};

		this.searchRef = react.createRef();
	}

	private stateSearchError() {
		this.setState({
			suggestions: [],
			error: true,
			noResults: false,
			selection: 0,
		});
	}

	private stateSearchClear(searchValue: string | undefined = undefined) {
		let obj: any = {
			suggestions: [],
			error: false,
			noResults: false,
			selection: 0,
		};
		if (searchValue !== undefined) obj.searchValue = searchValue;

		this.setState(obj);
	}

	private stateSearchResults(results: SearchSuggestion[]) {
		/* keep selection in bounds */
		let newSelect = this.state.selection;
		if (results.length === 0) {
			newSelect = 0;
		} else if (newSelect >= results.length) {
			newSelect = results.length - 1;
		}

		this.setState({
			suggestions: results,
			error: false,
			noResults: results.length === 0,
			selection: newSelect,
		});
	}

	private focusSearch() {
		const search = this.searchRef.current;
		if (search === null) return;

		search.focus();
	}

	private unFocusSearch() {
		const search = this.searchRef.current;
		if (search === null) return;

		search.blur();
	}

	private selectAllSearch() {
		const search = this.searchRef.current;
		if (search === null) return;

		search.selectionStart = 0;
		search.selectionEnd = search.value.length;
	}

	private makeSearch(query: string) {
		if (query.length === 0) {
			/* don't need to ask for empty search */
			this.stateSearchClear();
		} else {
			util.jsonGetRequest(`/api/collection/search/${query}`)
				.then(data => this.stateSearchResults(data))
				.catch(() => this.stateSearchError());
		}
	}

	render() {
		const { searchValue: initialValue, suggestions: initialSuggestions, selection: initialSelection, noResults: initialNoResults } = this.state;
		let composing = false;

		return (
			<div id="immr-search-area">
				<div className="search-grid">
					<input
						ref={this.searchRef}
						value={initialValue}
						id="immr-search"
						onFocus={event => {
							/* select everything on click in */
							this.selectAllSearch();
							this.makeSearch(event.currentTarget.value);
						}}
						onBlur={() => this.stateSearchClear()}
						onCompositionStart={() => (composing = true)}
						onCompositionEnd={() => (composing = false)}
						onKeyDown={event => {
							if (composing) return;

							const suggestions = this.state.suggestions;
							const searchSelection = this.state.selection;
							if (suggestions === undefined) return;

							if (event.code === 'ArrowDown') {
								event.preventDefault();
								let newSelect = searchSelection + 1;
								if (newSelect < suggestions.length) {
									this.setState({ selection: newSelect });
								}
							} else if (event.code === 'ArrowUp') {
								event.preventDefault();
								let newSelect = searchSelection - 1;
								if (newSelect >= 0) {
									this.setState({ selection: newSelect });
								}
							} else if (event.code === 'Escape') {
								event.preventDefault();
								this.unFocusSearch();
							} else if (event.code === 'Enter') {
								event.preventDefault();
								if (searchSelection < 0 || searchSelection >= suggestions.length) return;

								const suggestion = suggestions[searchSelection];

								//this.unFocusSearch();
								this.stateSearchClear(suggestion.word);
								this.props.onSearch(suggestions[searchSelection]);
							}
						}}
						onInput={async event => {
							const currentValue = event.currentTarget.value;
							if (currentValue === this.state.searchValue) return;

							this.setState({
								searchValue: currentValue,
							});

							const thisNo = ++currentGoodTypingEventNo;
							const query = event.currentTarget.value;

							/* save search calls */
							await util.wait(500);
							if (currentGoodTypingEventNo != thisNo) return;

							this.makeSearch(query);
						}}
					/>
					<button id="add-button" onClick={() => shared.goToNewPage('/new', [])}>
						+
					</button>
				</div>
				{initialSuggestions === undefined || initialNoResults || initialSuggestions.length > 0 ? (
					<div id="immr-search-suggestions">
						{initialSuggestions === undefined ? (
							<div className="immr-search-suggestion error">Something went wrong...</div>
						) : initialNoResults ? (
							<div className="immr-search-suggestion error">No results</div>
						) : (
							initialSuggestions.map(({ word }, i) => (
								<div className={`immr-search-suggestion ${i === initialSelection ? 'selected' : ''}`}>{word}</div>
							))
						)}
					</div>
				) : null}
			</div>
		);
	}
}
