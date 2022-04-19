import React, * as react from 'react';
import * as reactDom from 'react-dom';
import { WindowEvent } from './windowEvent';
import { Card, EditHistory, Highlights, NewCard, HistoryEntry, Part, SearchSuggestion, Views, NewField } from './types';
import * as util from './util';
import { SearchBox } from './searchBox';

type State = {
	currentCard: Card | undefined;
	parts: Part[];
	badges: { [key: string]: string };
	editingField: keyof Card | undefined;
	editHistory: EditHistory;
	newCard: NewCard;
	view: Views;
};

class UI extends react.Component<{}, State> {
	constructor(props: {}) {
		super(props);
		this.state = {
			currentCard: undefined,
			parts: [],
			badges: {},
			editingField: undefined,
			editHistory: [],
			newCard: util.blankNewCard(),
			view: Views.EDIT_CARD,
		};

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
				<option selected={selectedPart === undefined} value=""></option>
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
							onFocus={() => this.setState({ editingField: 'picture' })}
							onBlur={() => this.setState({ editingField: undefined })}
							onPaste={async event => {
								event.preventDefault();

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

		const newCardField = (initialNewCard: NewCard, cardField: keyof NewCard, prettyName: string) => {
			const field = initialNewCard[cardField] as NewField<HTMLInputElement>;
			return (
				<div className="immr-card-row">
					<p className={`new-caption ${field.error ? 'error' : ''}`}>{prettyName}</p>
					<input ref={field.ref} className="new-card-field" />
				</div>
			);
		};

		const newPartField = (initialNewCard: NewCard) => (
			<div className="immr-card-row">
				<p className="new-caption">Part of speech</p>
				<select ref={initialNewCard.part.ref} className="new-select">
					{this.partOptions(initialNewCard.part.value)}
				</select>
			</div>
		);

		const newPictureField = (initialNewCard: NewCard) => (
			<div className="immr-card-row">
				<p className="new-caption">Picture</p>
				{this.pictureInput(
					'image-container',
					<input
						readOnly
						ref={initialNewCard.picture.ref}
						onKeyDown={event => {
							if (event.code === 'Delete') {
								event.preventDefault();
								this.state.newCard.picture.value = '';
								this.setState({ newCard: this.state.newCard });
							}
						}}
						onPaste={async event => {
							event.preventDefault();

							const [buffer, filename] = await this.onPasteImage(event);
							await util.imagePostRequest(`/api/images/${filename}`, buffer);

							if (initialNewCard.picture.ref.current !== null) initialNewCard.picture.ref.current.value = filename;

							this.state.newCard.picture.value = filename;
							this.setState({ newCard: this.state.newCard }, () => console.log(this.state.newCard));
						}}
					/>,
					initialNewCard.picture.value,
				)}
			</div>
		);

		const newCardPanel = (initialNewCard: NewCard) => (
			<div id="immr-card-panel">
				{newCardField(initialNewCard, 'word', 'Word *')}
				{newPartField(initialNewCard)}
				{newCardField(initialNewCard, 'definition', 'Definition *')}
				{newCardField(initialNewCard, 'sentence', 'Sentence')}
				{newPictureField(initialNewCard)}
				<div className="immr-card-row">
					<div className="button-grid">
						<button
							className="new-button"
							onClick={() => {
								this.setState({
									view: Views.EDIT_CARD,
									currentCard: undefined,
								});
							}}
						>
							Cancel
						</button>
						<button
							className="new-button"
							onClick={() => {
								let foundError = false;

								const fields = Object.keys(this.state.newCard) as (keyof NewCard)[];
								for (const fieldName of fields) {
									const field = this.state.newCard[fieldName];

									/* the real value which will be passed */
									field.value = field.ref.current?.value;
									if (field.value === '') field.value = undefined;

									if (field.value === undefined && !field.nullable) {
										field.error = true;
										foundError = true;
									}
								}

								if (foundError) {
									this.setState({ newCard: this.state.newCard });
								} else {
									const newCard = this.state.newCard;

									const uploadCard: Card = {
										id: 0,
										word: newCard.word.value as string,
										part: newCard.part.value,
										definition: newCard.definition.value as string,
										sentence: newCard.sentence.value,
										picture: newCard.picture.value,
										date: new Date(),
										badges: [],
									};

									console.log(uploadCard);

									util.jsonPostRequest('/api/collection', uploadCard).then(res => {
										if (res.message !== undefined) {
											console.log(res.message);
										} else {
											this.setState({
												view: Views.EDIT_CARD,
												currentCard: undefined,
											});
										}
									});
								}
							}}
						>
							Create
						</button>
					</div>
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
				<SearchBox
					searchValue=""
					onSearch={({ id }) => {
						util.jsonGetRequest(`/api/collection/${id}`)
							.then((data: Card) => {
								this.setState({
									currentCard: data,
									editingField: undefined,
									editHistory: [],
								});
							})
							.catch(err => console.log('Could not find card', err));
					}}
				></SearchBox>
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
