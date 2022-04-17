import * as preact from 'react';
import * as reactDom from 'react-dom';
import { WindowEvent } from './windowEvent';

const wait = (time: number) => new Promise(acc => setTimeout(acc, time));

const jsonGetRequest = (url: string) =>
	new Promise<any>((acc, rej) =>
		fetch(url)
			.then(response => {
				response
					.json()
					.then(json => acc(json))
					.catch(rej);
			})
			.catch(rej),
	);

const imageGetRequest = (url: string) =>
	new Promise<string>((acc, rej) =>
		fetch(url).then(response => {
			response
				.blob()
				.then(blob => {
					const reader = new FileReader();
					reader.onloadend = () => {
						/* remove this part 'data:/;base64,' */
						/* add this part 'data:image/jpg;base64,' */
						const result = reader.result as string;

						acc('data:image/jpg;base64,' + result.substring(result.indexOf(',') + 1));
					};
					reader.onerror = rej;
					reader.readAsDataURL(blob);
				})
				.catch(rej);
		}),
	);

type Part = {
	english: string;
	korean: string;
};

export type SearchSuggestion = {
	word: string;
	id: number;
};

type Highlights = { part: string; highlight: boolean }[];
type EditHistory = { field: keyof Card; value: string | undefined }[];

const strToHighlights = (str: string) => {
	/* get indices of all the star markers */
	const indicies: number[] = [];
	let start = 0;
	while (true) {
		const nextIndex = str.indexOf('**', start);
		if (nextIndex === -1) {
			break;
		} else {
			indicies.push(nextIndex);
			start = nextIndex + 2;
		}
	}

	/* remove last fake index (no closing **) */
	if (indicies.length % 2 == 1) {
		indicies.pop();
	}

	/* don't need any processing */
	if (indicies.length === 0) return [{ part: str, highlight: false }];

	const ret: Highlights = [];

	/* for each pair of indices */
	for (let i = 0; i < indicies.length / 2; ++i) {
		ret.push({
			part: str.substring(i === 0 ? 0 : indicies[(i - 1) * 2 + 1] + 2, indicies[i * 2]),
			highlight: false,
		});
		ret.push({
			part: str.substring(indicies[i * 2] + 2, indicies[i * 2 + 1]),
			highlight: true,
		});
	}
	/* part after last pair */
	ret.push({
		part: str.substring(indicies[indicies.length - 1] + 2),
		highlight: false,
	});

	return ret;
};

/* globals */
let currentGoodTypingEventNo = 0;

type Card = {
	id: number;
	word: string;
	part: string | undefined;
	definition: string;
	sentence: string | undefined;
	sentenceHighlights: Highlights | undefined;
	picture: string | undefined;
	date: Date;
	badges: string[];
};

type State = {
	searchSuggestions: SearchSuggestion[] | undefined;
	noResults: boolean;
	searchSelection: number;
	currentCard: Card | undefined;
	currentImage: string | undefined;
	loadingImage: boolean;
	parts: { [key: string]: Part };
	badges: { [key: string]: string };
	searchValue: string;
	editingField: keyof Card | undefined;
	editHistory: EditHistory;
};

class UI extends preact.Component<{}, State> {
	searchRef: preact.RefObject<HTMLInputElement>;
	editBoxRef: preact.RefObject<HTMLSpanElement>;

	constructor(props: {}) {
		super(props);
		this.state = {
			searchSuggestions: [],
			noResults: false,
			searchSelection: 0,
			currentCard: undefined,
			currentImage: undefined,
			loadingImage: false,
			parts: {},
			badges: {},
			searchValue: '',
			editingField: undefined,
			editHistory: [],
		};

		this.searchRef = preact.createRef();
		this.editBoxRef = preact.createRef();

		Promise.all([jsonGetRequest(`/api/parts`), jsonGetRequest(`/api/badges`)]).then(([parts, badges]) => {
			this.setState({
				parts,
				badges,
			});
		});
	}

	private stateSearchResults(results: SearchSuggestion[] | undefined, noResults: boolean) {
		let newSelect = this.state.searchSelection;
		if (results === undefined || results.length === 0) {
			newSelect = 0;
		} else if (newSelect >= results.length) {
			newSelect = results.length - 1;
		}

		return {
			searchSuggestions: results,
			searchSelection: newSelect,
			noResults: noResults && results?.length === 0,
		};
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
		/* don't need to ask for empty search */
		if (query.length === 0) {
			this.setState(this.stateSearchResults([], false));
		} else {
			jsonGetRequest(`/api/collection/search/${query}`)
				.then(data => this.setState(this.stateSearchResults(data, true)))
				.catch(() => this.setState(this.stateSearchResults(undefined, false)));
		}
	}

	confirm(newValue: string, nullable: boolean, forField: keyof Card) {
		const currentCard = this.state.currentCard;
		/* impossible, but just in case */
		if (currentCard === undefined) {
			return this.setState({ editingField: undefined });
		}

		const history = this.state.editHistory;

		const filtered = newValue.trim();
		if (filtered.length === 0) {
			if (nullable) {
				history.push({ field: forField, value: currentCard[forField] as string | undefined });
				(currentCard[forField] as string | undefined) = undefined;
			} else {
				/* do not modify, illegal */
			}
		} else {
			history.push({ field: forField, value: currentCard[forField] as string | undefined });
			(currentCard[forField] as string) = filtered;
		}

		this.setState({
			currentCard: currentCard,
			editingField: undefined,
			editHistory: history,
		});
	}

	goIntoEdit(field: keyof Card) {
		this.setState({ editingField: field }, () => {
			const editBox = this.editBoxRef.current;
			if (editBox !== null) {
				editBox.focus();

				const selection = window.getSelection();
				const range = document.createRange();
				range.selectNodeContents(editBox);
				selection?.removeAllRanges();
				selection?.addRange(range);
			}
		});
	}

	render() {
		const searchBar = (
			initialSearchValue: string,
			initialSearchSuggestions: SearchSuggestion[] | undefined,
			initialNoResults: boolean,
			initialSearchSelection: number,
		) => (
			<div id="immr-search-area">
				<input
					ref={this.searchRef}
					value={initialSearchValue}
					id="immr-search"
					onFocus={event => {
						/* select everything on click in */
						this.selectAllSearch();
						this.makeSearch(event.currentTarget.value);
					}}
					onBlur={event => {
						this.setState(this.stateSearchResults([], false));
					}}
					onCompositionStart={event => {
						event.currentTarget.dataset.composing = 'T';
					}}
					onCompositionEnd={event => {
						event.currentTarget.dataset.composing = 'F';
					}}
					onKeyDown={event => {
						if (event.currentTarget.dataset.composing === 'T') {
							return;
						}

						const suggestions = this.state.searchSuggestions;
						const searchSelection = this.state.searchSelection;
						if (suggestions === undefined) return;

						if (event.code === 'ArrowDown') {
							event.preventDefault();
							let newSelect = searchSelection + 1;
							if (newSelect < suggestions.length) {
								this.setState({ searchSelection: newSelect });
							}
						} else if (event.code === 'ArrowUp') {
							event.preventDefault();
							let newSelect = searchSelection - 1;
							if (newSelect >= 0) {
								this.setState({ searchSelection: newSelect });
							}
						} else if (event.code === 'Escape') {
							event.preventDefault();
							this.unFocusSearch();
						} else if (event.code === 'KeyZ' && event.ctrlKey) {
							event.preventDefault();
						} else if (event.code === 'Enter') {
							++currentGoodTypingEventNo;
							event.preventDefault();
							if (searchSelection < 0 || searchSelection >= suggestions.length) return;

							const { id, word } = suggestions[searchSelection];

							this.setState(Object.assign(this.stateSearchResults([], false), { searchValue: word.slice() }), () => {
								this.selectAllSearch();
							});

							jsonGetRequest(`/api/collection/${id}`)
								.then((data: Card) => {
									if (data.sentence !== undefined) {
										data.sentenceHighlights = strToHighlights(data.sentence);
									}
									this.setState({
										currentCard: data,
										currentImage: undefined,
										editingField: undefined,
										editHistory: [],
										loadingImage: data.picture !== undefined,
									});

									if (data.picture !== undefined) {
										imageGetRequest(`/api/images/${data.picture}`)
											.then((imageData: string) => {
												this.setState({
													currentImage: imageData,
													loadingImage: false,
												});
											})
											.catch(() => {
												this.setState({
													loadingImage: false,
												});
											});
									}
								})
								.catch(() => {
									alert('Could not find card');
								});
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
						await wait(500);
						if (currentGoodTypingEventNo != thisNo) return;

						this.makeSearch(query);
					}}
				/>
				{initialSearchSuggestions === undefined || initialNoResults || initialSearchSuggestions.length > 0 ? (
					<div id="immr-search-suggestions">
						{initialSearchSuggestions === undefined ? (
							<div className="immr-search-suggestion error">Something went wrong...</div>
						) : initialNoResults ? (
							<div className="immr-search-suggestion error">No results</div>
						) : (
							initialSearchSuggestions.map(({ word }, i) => (
								<div className={`immr-search-suggestion ${i === initialSearchSelection ? 'selected' : ''}`}>{word}</div>
							))
						)}
					</div>
				) : null}
			</div>
		);

		const editBox = (initialValue: string, nullable: boolean, forField: keyof Card) => {
			return (
				<span
					ref={this.editBoxRef}
					className="immr-card-edit"
					role="textbox"
					contentEditable
					/* exit and confirmation conditions */
					onKeyDown={event => {
						event.stopPropagation();

						/* cancel edit */
						if (event.code === 'Escape' || (event.code === 'KeyZ' && event.ctrlKey)) {
							event.preventDefault();
							/* mark onBlur not to trigger */
							event.currentTarget.contentEditable = 'false';
							this.setState({
								editingField: undefined,
							});
							/* confirm edit */
						} else if (event.code === 'Enter') {
							event.preventDefault();
							/* mark onBlur not to trigger */
							event.currentTarget.contentEditable = 'false';
							this.confirm(event.currentTarget.textContent as string, nullable, forField);
						}
					}}
					onBlur={event => {
						event.stopPropagation();
						if (event.currentTarget.contentEditable === 'true') {
							this.confirm(event.currentTarget.textContent as string, nullable, forField);
						}
					}}
				>
					{initialValue as string}
				</span>
			);
		};

		const cardPanel = (
			initialCard: Card,
			initialCurrentImage: string | undefined,
			initialEditingField: string | undefined,
			initialLoadingImage: boolean,
			initialParts: { [key: string]: Part },
		) => {
			return (
				<div id="immr-card-panel">
					<WindowEvent
						eventName="keydown"
						callBack={event => {
							if (event.code === 'KeyZ' && event.ctrlKey) {
								/* don't edit the stale captured card*/
								const currentCard = this.state.currentCard;
								if (currentCard === undefined) return;

								const history = this.state.editHistory;
								const lastEdit = history.pop();
								if (lastEdit === undefined) return;

								(currentCard[lastEdit.field] as string | undefined) = lastEdit.value;

								this.setState({
									currentCard: currentCard,
									editHistory: history,
								});
							}
						}}
					></WindowEvent>
					<div className="immr-card-row">
						<p
							className="big"
							style={{ fontWeight: 'bold' }}
							onClick={
								initialEditingField === 'word'
									? undefined
									: event => {
											event.stopPropagation();
											this.goIntoEdit('word');
									  }
							}
						>
							{initialEditingField === 'word' ? editBox(initialCard.word, false, 'word') : null}
							{initialCard.word}
						</p>
						<p className="big" style={{ color: 'rgb(205, 182, 103)' }}>
							{initialParts[initialCard.part ?? '']?.english ?? ''}
						</p>
					</div>
					<div className="immr-card-row">
						<p
							className="small"
							onClick={
								initialEditingField === 'definition'
									? undefined
									: event => {
											event.stopPropagation();
											this.goIntoEdit('definition');
									  }
							}
						>
							{initialEditingField === 'definition' ? editBox(initialCard.definition, false, 'definition') : null}
							{initialCard.definition}
						</p>
					</div>
					<div className="immr-card-line" />
					<p className="immr-card-sentence">
						{initialCard.sentenceHighlights === undefined ? (
							<span />
						) : (
							initialCard.sentenceHighlights.map(({ part, highlight }) => <span className={highlight ? 'highlight' : ''}>{part}</span>)
						)}
					</p>
					{initialCurrentImage !== undefined ? (
						<img src={initialCurrentImage} />
					) : (
						<div className="immr-image-placeholder">
							<span>{initialLoadingImage ? 'Loading...' : 'Paste Image here'}</span>
						</div>
					)}
				</div>
			);
		};

		return (
			<div id="immr-panel">
				{searchBar(this.state.searchValue, this.state.searchSuggestions, this.state.noResults, this.state.searchSelection)}
				{this.state.currentCard === undefined
					? null
					: cardPanel(this.state.currentCard, this.state.currentImage, this.state.editingField, this.state.loadingImage, this.state.parts)}
				{
					<p
						style={{
							color: 'white',
							position: 'absolute',
							bottom: '10px',
						}}
					>
						{`${this.state.searchSelection} ${this.state.noResults} ${this.state.searchValue}`}
					</p>
				}
			</div>
		);
	}
}

console.log('Anki being killed...');

reactDom.render(<UI />, document.body);
