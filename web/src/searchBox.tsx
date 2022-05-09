import * as react from 'react';
import { SearchSuggestion } from './types';
import * as util from './util';
import * as shared from './shared';

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

	currentGoodTypingEventNo: number;
	waitingOnInput: boolean;

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

		this.currentGoodTypingEventNo = 0;
		this.waitingOnInput = false;
	}

	private stateSearchError() {
		return new Promise<void>(acc =>
			this.setState(
				{
					suggestions: [],
					error: true,
					noResults: false,
					selection: 0,
				},
				acc,
			),
		);
	}

	private stateSearchClear(searchValue: string | undefined = undefined) {
		let obj: any = {
			suggestions: [],
			error: false,
			noResults: false,
			selection: 0,
		};
		if (searchValue !== undefined) obj.searchValue = searchValue;

		return new Promise<void>(acc => this.setState(obj, acc));
	}

	private stateSearchResults(results: SearchSuggestion[]) {
		/* keep selection in bounds */
		let newSelect = this.state.selection;
		if (results.length === 0) {
			newSelect = 0;
		} else if (newSelect >= results.length) {
			newSelect = results.length - 1;
		}

		return new Promise<void>(acc =>
			this.setState(
				{
					suggestions: results,
					error: false,
					noResults: results.length === 0,
					selection: newSelect,
				},
				acc,
			),
		);
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
			return this.stateSearchClear();
		} else {
			return util
				.getRequest<SearchSuggestion[]>(`/api/collection/search/${query}/10`)
				.then(([code, data]) => (util.isGood(code, data) ? this.stateSearchResults(data) : this.stateSearchError()));
		}
	}

	setElBool(target: HTMLOrSVGElement, name: string, value: boolean) {
		value ? (target.dataset[name] = 't') : delete target.dataset[name];
	}
	getElBool(target: HTMLOrSVGElement, name: string) {
		return target.dataset[name] !== undefined;
	}

	render() {
		const { searchValue: initialValue, suggestions: initialSuggestions, selection: initialSelection, noResults: initialNoResults } = this.state;

		const select = () => {
			const searchSelection = this.state.selection;
			const suggestions = this.state.suggestions;

			if (searchSelection < 0 || searchSelection >= suggestions.length) return;

			this.props.onSearch(suggestions[searchSelection]);
		};

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
						onBlur={() => {
							this.stateSearchClear();
							console.log('blur');
						}}
						onCompositionStart={event => this.setElBool(event.currentTarget, 'composing', true)}
						onCompositionEnd={event => this.setElBool(event.currentTarget, 'composing', false)}
						onKeyDown={event => {
							if (this.getElBool(event.currentTarget, 'composing')) {
								console.log('prevented');
								return;
							}

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

								if (this.waitingOnInput) {
									++this.currentGoodTypingEventNo;
									this.makeSearch(event.currentTarget.value).then(() => select());
								} else {
									select();
								}
							}
						}}
						onInput={async event => {
							const currentValue = event.currentTarget.value;
							if (currentValue === this.state.searchValue) return;

							this.setState({
								searchValue: currentValue,
							});

							const thisNo = ++this.currentGoodTypingEventNo;
							this.waitingOnInput = true;
							const query = event.currentTarget.value;

							/* save search calls */
							await util.wait(250);
							if (this.currentGoodTypingEventNo != thisNo) return;
							this.waitingOnInput = false;

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
