import * as react from 'react';
import * as reactDom from 'react-dom';
import { WindowEvent } from './windowEvent';
import { Card, EditHistory, HistoryEntry, Part } from './types';
import * as util from './util';
import { SearchBox } from './searchBox';
import * as shared from './shared';

type Props = {
	initialId: number | undefined;
	initialWord: string | undefined;
};

type State = {
	parts: Part[];
	badges: { [key: string]: string };

	error: boolean;
	currentCard: Card | undefined;
	editingField: keyof Card | undefined;
	editHistory: EditHistory;
};

class EditPage extends react.Component<Props, State> {
	constructor(props: Props) {
		super(props);

		this.state = {
			parts: [],
			badges: {},

			error: false,
			currentCard: undefined,
			editingField: undefined,
			editHistory: [],
		};

		shared.getPartsBadges().then(({ parts, badges }) => this.setState({ parts, badges }));

		if (props.initialId !== undefined) {
			util.jsonGetRequest(`/api/collection/${props.initialId}`)
				.then(data => {
					if (data.message) {
						this.setState({ error: true });
					} else {
						this.setState({ currentCard: data });
					}
				})
				.catch(() => this.setState({ error: true }));
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

		return (
			<div id="immr-panel">
				{shared.killCtrlZ()}
				<SearchBox
					searchValue={this.props.initialWord ?? ''}
					onSearch={({ word, id }) =>
						shared.goToNewPage('/edit', [
							['id', id.toString()],
							['word', word],
						])
					}
				></SearchBox>
				{this.state.currentCard === undefined ? null : cardPanel(this.state.currentCard, this.state.editingField, this.state.parts)}
			</div>
		);
	}
}

const searchParams = new URLSearchParams(window.location.search);
const initialId = searchParams.get('id');

reactDom.render(<EditPage initialId={initialId === null ? undefined : +initialId} initialWord={searchParams.get('word') ?? undefined} />, document.body);
