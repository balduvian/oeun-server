import * as preact from 'react';
import * as reactDom from 'react-dom';
import { WindowEvent } from './windowEvent';
import { Card, EditHistory, Highlights, HistoryEntry, Part, SearchSuggestion } from './types';
import * as util from './util';

/* globals */
let currentGoodTypingEventNo = 0;

type State = {
	searchSuggestions: SearchSuggestion[] | undefined;
	noResults: boolean;
	searchSelection: number;
	currentCard: Card | undefined;
	parts: Part[];
	badges: { [key: string]: string };
	searchValue: string;
	editingField: keyof Card | undefined;
	editHistory: EditHistory;
};

class UI extends preact.Component<{}, State> {
	searchRef: preact.RefObject<HTMLInputElement>;
	editBoxRef: preact.RefObject<HTMLParagraphElement>;

	constructor(props: {}) {
		super(props);
		this.state = {
			searchSuggestions: [],
			noResults: false,
			searchSelection: 0,
			currentCard: undefined,
			parts: [],
			badges: {},
			searchValue: '',
			editingField: undefined,
			editHistory: [],
		};

		this.searchRef = preact.createRef();
		this.editBoxRef = preact.createRef();

		Promise.all([util.jsonGetRequest(`/api/parts`), util.jsonGetRequest(`/api/badges`)]).then(([parts, badges]) => {
			this.setState({
				parts: Object.keys(parts).map(partName => ({
					id: partName,
					english: parts[partName].english,
					korean: parts[partName].korean,
				})),
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
			util.jsonGetRequest(`/api/collection/search/${query}`)
				.then(data => this.setState(this.stateSearchResults(data, true)))
				.catch(() => this.setState(this.stateSearchResults(undefined, false)));
		}
	}

	confirmFieldEdit(newValue: string, nullable: boolean, forField: keyof Card) {
		const currentCard = this.state.currentCard;
		/* impossible, but just in case */
		if (currentCard === undefined) return this.setState({ editingField: undefined });

		const history = this.state.editHistory;
		const lastHistoryEntry = history.length === 0 ? undefined : history[history.length - 1];

		/* prevent history duplicates */
		const sameEntry = (entry: HistoryEntry | undefined, newField: keyof Card, newValue: string | undefined) => {
			return entry?.field === newField && entry?.value === newValue;
		};

		let filtered0 = newValue.trim();
		let filtered1 = filtered0.length === 0 ? undefined : filtered0;

		if ((filtered1 !== undefined || nullable) && !sameEntry(lastHistoryEntry, forField, filtered1)) {
			/* first add the current value to history */
			history.push({ field: forField, value: currentCard[forField] as string | undefined });

			/* modify card with new value */
			(currentCard[forField] as string | undefined) = filtered1;

			//TODO edit database
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
				//editBox.focus();
				//const selection = window.getSelection();
				//const range = document.createRange();
				//range.selectNodeContents(editBox);
				//selection?.removeAllRanges();
				//selection?.addRange(range);
			}
		});
	}

	partName(partid: string | undefined) {
		if (partid === undefined) return undefined;
		return this.state.parts.find(part => part.id === partid)?.english;
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
						} else if (event.code === 'Enter') {
							++currentGoodTypingEventNo;
							event.preventDefault();
							if (searchSelection < 0 || searchSelection >= suggestions.length) return;

							const { id, word } = suggestions[searchSelection];

							this.setState(Object.assign(this.stateSearchResults([], false), { searchValue: word.slice() }), () => {
								this.selectAllSearch();
							});

							util.jsonGetRequest(`/api/collection/${id}`)
								.then((data: Card) => {
									this.setState({
										currentCard: data,
										editingField: undefined,
										editHistory: [],
									});
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
						await util.wait(500);
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

		const editDropdown = (initialPart: string | undefined, initialParts: Part[], visible: boolean) => {
			let cancelBlur = false;
			return (
				<select
					className={`immr-part-edit ${visible ? 'visible' : ''}`}
					onKeyDown={event => {
						if (event.code === 'Escape' || (event.code === 'KeyZ' && event.ctrlKey)) {
							/* cancel editing */
							event.preventDefault();
							cancelBlur = true;

							this.setState({
								editingField: undefined,
							});
						} else if (event.code === 'Enter') {
							event.preventDefault();
							cancelBlur = true;

							this.confirmFieldEdit(event.currentTarget.value, true, 'part');
						}
					}}
					onChange={event => {
						cancelBlur = true;
						console.log('changed to', event.currentTarget.value);
						this.confirmFieldEdit(event.currentTarget.value, true, 'part');
					}}
					onBlur={event => {
						if (!cancelBlur) {
							this.confirmFieldEdit(event.currentTarget.value, true, 'part');
						}
						cancelBlur = false;
					}}
				>
					{initialParts.map(part => (
						<option selected={part.id === initialPart} value={part.id}>
							{part.english}
						</option>
					))}
					<option selected={initialPart === undefined} value="" style={{ textDecoration: 'italic' }}>
						{'No part'}
					</option>
				</select>
			);
		};

		const cardField = (
			className: string,
			style: preact.CSSProperties,
			initialValue: string | undefined,
			displayValue: any,
			nullable: boolean,
			forField: keyof Card,
			editing: boolean,
		) => {
			let cancelBlur = false;
			return (
				<p
					ref={editing ? this.editBoxRef : undefined}
					className={`immr-card-edit ${editing ? 'editing' : ''} ${className}`}
					style={style}
					role="textbox"
					contentEditable
					/* exit and confirmation conditions */
					onKeyDown={
						!editing
							? undefined
							: event => {
									/* cancel edit */
									if (event.code === 'Escape' || (event.code === 'KeyZ' && event.ctrlKey)) {
										event.preventDefault();
										cancelBlur = true;
										this.setState({
											editingField: undefined,
										});
										/* confirm edit */
									} else if (event.code === 'Enter') {
										event.preventDefault();
										cancelBlur = true;
										this.confirmFieldEdit(event.currentTarget.textContent as string, nullable, forField);
									}
							  }
					}
					onBlur={
						!editing
							? undefined
							: event => {
									if (!cancelBlur) {
										this.confirmFieldEdit(event.currentTarget.textContent as string, nullable, forField);
									}
									cancelBlur = false;
							  }
					}
					onClick={
						this.state.editingField === forField
							? undefined
							: event => {
									event.stopPropagation();
									this.goIntoEdit(forField);
							  }
					}
				>
					{editing ? initialValue ?? '' : displayValue}
				</p>
			);
		};

		const cardPanel = (initialCard: Card, initialEditingField: string | undefined, initialParts: Part[]) => {
			const highlights = initialCard.sentence === undefined ? undefined : util.strToHighlights(initialCard.sentence);
			return (
				<div id="immr-card-panel">
					<WindowEvent
						eventName="keydown"
						callBack={event => {
							if (event.code === 'KeyZ' && event.ctrlKey) {
								event.preventDefault();

								const card = this.state.currentCard;
								if (card === undefined) return;

								const history = this.state.editHistory;
								const lastEdit = history.pop();
								if (lastEdit === undefined) return;

								(card[lastEdit.field] as string | undefined) = lastEdit.value;

								this.setState({
									currentCard: card,
									editHistory: history,
								});
							}
						}}
					></WindowEvent>
					<div className="immr-card-row">
						{cardField('big', { fontWeight: 'bold' }, initialCard.word, initialCard.word, false, 'word', initialEditingField === 'word')}
						<p
							className={`big ${initialCard.part === undefined || initialEditingField === 'part' ? 'no-part' : 'part'}`}
							onClick={
								initialEditingField === 'part'
									? undefined
									: event => {
											event.stopPropagation();
											this.goIntoEdit('part');
									  }
							}
						>
							{editDropdown(initialCard.part, initialParts, initialEditingField === 'part')}
							{initialEditingField === 'part' ? 'a' : this.partName(initialCard.part) ?? 'a' /* invisible placeholder text */}
						</p>
					</div>
					<div className="immr-card-row">
						{cardField('small', {}, initialCard.definition, initialCard.definition, false, 'definition', initialEditingField === 'definition')}
					</div>
					<div className="immr-card-line" />
					{cardField(
						'immr-card-sentence',
						{},
						initialCard.sentence,
						highlights === undefined ? (
							<span />
						) : (
							highlights.map(({ part, highlight }) => <span className={highlight ? 'highlight' : ''}>{part}</span>)
						),
						true,
						'sentence',
						initialEditingField === 'sentence',
					)}
					<div className={`image-container ${initialEditingField === 'picture' ? 'image-editing' : ''}`}>
						<input
							onFocus={event => {
								event.stopPropagation();
								this.setState({
									editingField: 'picture',
								});
							}}
							onBlur={event => {
								event.stopPropagation();
								this.setState({
									editingField: undefined,
								});
							}}
							onPaste={event => {
								if (this.state.editingField !== 'picture') return;

								const card = this.state.currentCard;
								if (card === undefined) return;

								const items = event.clipboardData;
								console.log(items);
								const goodItem = [...items.items].find(item => {
									console.log(item);
									return item.type === 'image/png' || item.type === 'image/jpeg';
								});
								const file = goodItem?.getAsFile() ?? undefined;
								if (file === undefined) return;

								const imageName = 'paste-' + Date.now().toString() + '.jpg';

								file.arrayBuffer().then(async buffer => {
									console.log(await util.imagePostRequest(`/api/images/${imageName}`, buffer));

									card.picture = imageName;
									this.setState({
										currentCard: card,
									});
								});
							}}
						></input>
						{initialCard.picture !== undefined ? (
							<img className="card-img" src={'/api/images/' + initialCard.picture} />
						) : (
							<div className="immr-image-placeholder">
								<span>Paste Image here</span>
							</div>
						)}
					</div>
				</div>
			);
		};

		return (
			<div id="immr-panel">
				<WindowEvent
					eventName="keydown"
					callBack={event => {
						/* this is some bullshit */
						if (event.code === 'KeyZ' && event.ctrlKey) event.preventDefault();
					}}
				></WindowEvent>
				{searchBar(this.state.searchValue, this.state.searchSuggestions, this.state.noResults, this.state.searchSelection)}
				{this.state.currentCard === undefined ? null : cardPanel(this.state.currentCard, this.state.editingField, this.state.parts)}
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
