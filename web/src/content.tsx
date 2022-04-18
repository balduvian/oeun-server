import React, * as react from 'react';
import * as reactDom from 'react-dom';
import { WindowEvent } from './windowEvent';
import { Card, EditHistory, Highlights, HistoryEntry, Part, SearchSuggestion, Views } from './types';
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
	newCard: Partial<Card>;
	view: Views;
};

class UI extends react.Component<{}, State> {
	searchRef: react.RefObject<HTMLInputElement>;

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
			newCard: {},
			view: Views.NEW_CARD,
		};

		this.searchRef = react.createRef();

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

	cancelFieldEdit(eventTarget: (HTMLOrSVGElement & ElementContentEditable & Node) | undefined) {
		return this.confirmFieldEdit(undefined, false, 'word', eventTarget);
	}

	/**
	 * @param newValue set to undefined if you wish to not edit
	 */
	confirmFieldEdit(
		newValue: string | undefined,
		nullable: boolean,
		forField: keyof Card,
		eventTarget: (HTMLOrSVGElement & ElementContentEditable & Node) | undefined,
	) {
		eventTarget?.blur();

		const currentCard = this.state.currentCard;
		const history = this.state.editHistory;

		/* cancelled or invalid state */
		if (currentCard !== undefined && newValue !== undefined) {
			/* make an edit */
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
		}

		this.setState({
			currentCard: currentCard,
			editingField: undefined,
			editHistory: history,
		});
	}

	goIntoEdit(field: keyof Card) {
		this.setState({ editingField: field });
	}

	partName(partId: string | undefined) {
		if (partId === undefined) return undefined;
		return this.state.parts.find(part => part.id === partId)?.english;
	}

	partOptions(selectedPart: string | undefined) {
		return (
			<>
				{this.state.parts.map(part => (
					<option selected={part.id === selectedPart} value={part.id}>
						{part.english}
					</option>
				))}
				<option selected={selectedPart === undefined} value="">
					No part
				</option>
			</>
		);
	}

	async onPasteImage(event: react.ClipboardEvent<HTMLInputElement>): Promise<[ArrayBuffer, string]> {
		const file = [...event.clipboardData.items].find(item => item.type === 'image/png' || item.type === 'image/jpeg')?.getAsFile() ?? undefined;
		if (file === undefined) return Promise.reject();

		const buffer = await file.arrayBuffer();

		return [buffer, 'paste-' + Date.now().toString() + '.jpg'];
	}

	pictureInput(className: string, inputElement: react.ReactElement, imageName: string | undefined) {
		return (
			<div className={className}>
				{inputElement}
				{imageName !== undefined ? (
					<img className="card-img" src={'/api/images/' + imageName} />
				) : (
					<div className="immr-image-placeholder">
						<span>Paste Image here</span>
					</div>
				)}
			</div>
		);
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

							this.cancelFieldEdit(event.currentTarget);
						} else if (event.code === 'Enter') {
							event.preventDefault();
							cancelBlur = true;

							this.confirmFieldEdit(event.currentTarget.value, true, 'part', event.currentTarget);
						}
					}}
					onChange={event => {
						cancelBlur = true;
						console.log('changed to', event.currentTarget.value);
						this.confirmFieldEdit(event.currentTarget.value, true, 'part', event.currentTarget);
					}}
					onBlur={event => {
						if (!cancelBlur) {
							this.confirmFieldEdit(event.currentTarget.value, true, 'part', event.currentTarget);
						}
						cancelBlur = false;
					}}
				>
					{this.partOptions(initialPart)}
				</select>
			);
		};

		const cardField = (
			className: string,
			style: react.CSSProperties,
			initialValue: string | undefined,
			displayValue: any,
			nullable: boolean,
			forField: keyof Card,
			editing: boolean,
		) => {
			let cancelBlur = false;
			let cancelTyping = false;
			return (
				<p
					className={`immr-card-edit ${editing ? 'editing' : ''} ${className}`}
					style={style}
					role="textbox"
					contentEditable
					tabIndex={100}
					onCompositionStart={() => (cancelTyping = true)}
					onCompositionEnd={() => (cancelTyping = false)}
					/* exit and confirmation conditions */
					onKeyDown={event => {
						if (cancelTyping) return;
						if (event.code === 'Escape' || (event.code === 'KeyZ' && event.ctrlKey)) {
							/* cancel edit */
							event.preventDefault();
							cancelBlur = true;
							this.cancelFieldEdit(event.currentTarget);
						} else if (event.code === 'Enter') {
							/* confirm edit */
							event.preventDefault();
							cancelBlur = true;
							this.confirmFieldEdit(event.currentTarget.textContent as string, nullable, forField, event.currentTarget);
						}
					}}
					onBlur={event => {
						if (!cancelBlur) {
							this.confirmFieldEdit(event.currentTarget.textContent as string, nullable, forField, event.currentTarget);
						}
						cancelBlur = false;
					}}
					onFocus={() => this.goIntoEdit(forField)}
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
					{this.pictureInput(
						`image-container ${initialEditingField === 'picture' ? 'image-editing' : ''}`,
						<input
							onFocus={event => this.setState({ editingField: 'picture' })}
							onBlur={event => this.setState({ editingField: undefined })}
							onPaste={async event => {
								if (this.state.editingField !== 'picture') return;

								const card = this.state.currentCard;
								if (card === undefined) return;

								const [buffer, filename] = await this.onPasteImage(event);

								await util.imagePostRequest(`/api/images/${filename}`, buffer);

								card.picture = filename;
								this.setState({
									currentCard: card,
								});
							}}
						></input>,
						initialCard.picture,
					)}
				</div>
			);
		};

		const newCardField = (prettyName: string, cardField: keyof Card) => {
			let cancelTyping = false;
			return (
				<>
					<p className="new-caption">{prettyName}</p>
					<input
						onCompositionStart={() => (cancelTyping = true)}
						onCompositionEnd={() => (cancelTyping = false)}
						onInput={event => {
							if (cancelTyping) return;

							const value = event.currentTarget.value.length === 0 ? undefined : event.currentTarget.value;
							Object.assign(this.state.newCard, { [cardField]: value });

							this.setState({
								newCard: this.state.newCard,
							});
						}}
						className="new-card-field"
					/>
				</>
			);
		};

		const newCardPanel = (initialNewCard: Partial<Card>) => (
			<div id="immr-card-panel">
				<div className="new-card-row">{newCardField('Word', 'word')}</div>
				<div className="new-card-row">
					<p className="new-caption">Part of speech</p>
					<select>{this.partOptions(initialNewCard.part)}</select>
				</div>
				<div className="new-card-row">{newCardField('Definition', 'definition')}</div>
				<div className="new-card-row">{newCardField('Sentence', 'sentence')}</div>
				<div className="new-card-row">
					<p>Picture</p>
					{this.pictureInput('image-container', <input />, initialNewCard.picture)}
				</div>
				<div className="new-card-row button-row">
					<button className="new-button">Cancel</button>
					<button className="new-button">Create</button>
				</div>
			</div>
		);

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
				{this.state.view === Views.EDIT_CARD ? (
					<>{this.state.currentCard === undefined ? null : cardPanel(this.state.currentCard, this.state.editingField, this.state.parts)}</>
				) : (
					<>{newCardPanel(this.state.newCard)}</>
				)}
			</div>
		);
	}
}

console.log('Anki being killed...');

reactDom.render(<UI />, document.body);
