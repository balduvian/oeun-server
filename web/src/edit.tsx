import * as react from 'react';
import * as reactDom from 'react-dom';
import { WindowEvent } from './windowEvent';
import { Card, EditHistory, HistoryEntry, Part, Editing } from './types';
import * as util from './util';
import { SearchBox } from './searchBox';
import * as shared from './shared';
import { threadId } from 'worker_threads';

type Props = {
	initialId: number | undefined;
	initialWord: string | undefined;
};

type State = {
	parts: Part[];
	badges: { [key: string]: string };

	error: boolean;
	currentCard: Card | undefined;
	editHistory: EditHistory;
	editing: Editing;
};

class EditPage extends react.Component<Props, State> {
	constructor(props: Props) {
		super(props);

		this.state = {
			parts: [],
			badges: {},

			error: false,
			currentCard: undefined,
			editHistory: [],
			editing: {},
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

		const card = this.state.currentCard;
		const history = this.state.editHistory;

		/* cancelled or invalid state */
		if (card !== undefined && newValue !== undefined) {
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
				history.push({ field: forField, value: card[forField] as string | undefined });

				/* modify card with new value */
				(card[forField] as string | undefined) = filtered1;

				this.databaseChange(card.id, { [forField]: filtered1 });
			}
		}

		this.setState(
			Object.assign(
				{
					currentCard: card,
					editHistory: history,
				},
				this.setEditing(forField, false),
			),
		);
	}

	async onPasteImage(event: react.ClipboardEvent<HTMLInputElement>): Promise<[ArrayBuffer, string]> {
		const file = [...event.clipboardData.items].find(item => item.type === 'image/png' || item.type === 'image/jpeg')?.getAsFile() ?? undefined;
		if (file === undefined) return Promise.reject();

		const buffer = await file.arrayBuffer();

		return [buffer, 'paste-' + Date.now().toString() + '.jpg'];
	}

	isEditing(field: string) {
		return this.state.editing[field] ?? false;
	}
	setEditing(field: string, value: boolean) {
		this.state.editing[field] = value;
		return { editing: this.state.editing };
	}

	databaseChange(id: number, obj: { [key: string]: any }) {
		util.jsonPatchRequest(
			'/api/collection',
			Object.assign(
				{
					id: id,
				},
				obj,
			),
		).then(res => console.log(res));
	}

	render() {
		const editDropdown = (initialPart: string | undefined, initialParts: Part[]) => {
			let cancelBlur = false;
			return (
				<select
					className={`immr-part-edit ${initialPart === undefined ? 'no-part' : ''}`}
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
					onFocus={() => this.setState(this.setEditing('part', true))}
				>
					{shared.partOptions(initialParts, initialPart)}
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
		) => {
			let cancelBlur = false;
			let cancelTyping = false;
			return (
				<p
					className={`immr-card-edit ${className}`}
					style={style}
					role="textbox"
					contentEditable
					tabIndex={100}
					onCompositionStart={() => (cancelTyping = true)}
					onCompositionEnd={() => (cancelTyping = false)}
					onKeyDown={event => {
						if (cancelTyping) return;
						if (event.code === 'Escape' || (event.code === 'KeyZ' && event.ctrlKey)) {
							event.preventDefault();
							cancelBlur = true;

							this.cancelFieldEdit(event.currentTarget);
						} else if (event.code === 'Enter') {
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
					onFocus={() => this.setState(this.setEditing(forField, true))}
				>
					{this.isEditing(forField) ? initialValue ?? '' : displayValue}
				</p>
			);
		};

		const cardPanel = (initialCard: Card, initialParts: Part[]) => {
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

								this.databaseChange(card.id, { [lastEdit.field]: lastEdit.value });
							}
						}}
					></WindowEvent>
					<div className="immr-card-row">
						{cardField('big', { fontWeight: 'bold' }, initialCard.word, initialCard.word, false, 'word')}
						{editDropdown(initialCard.part, initialParts)}
						<button
							className="delete-button"
							onClick={() => {
								const card = this.state.currentCard;
								if (card === undefined) return;

								util.jsonDeleteRequest(`/api/collection/${card.id}`).then(({ message }) => {
									if (message === 'Deleted') {
										shared.goToNewPage('/edit', []);
									} else {
										console.log(message);
									}
								});
							}}
						>
							X
						</button>
					</div>
					<div className="immr-card-row">{cardField('small', {}, initialCard.definition, initialCard.definition, false, 'definition')}</div>

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
					)}
					{shared.pictureInput(
						'image-container',
						<input
							readOnly
							onFocus={() => this.setState(this.setEditing('picture', true))}
							onBlur={() => this.setState(this.setEditing('picture', false))}
							onKeyDown={event => {
								if (event.code === 'Delete') {
									event.preventDefault();
									this.confirmFieldEdit(undefined, true, 'picture', event.currentTarget);
								}
							}}
							onPaste={async event => {
								event.preventDefault();

								const card = this.state.currentCard;
								if (card === undefined) return;

								const [buffer, filename] = await this.onPasteImage(event);

								await util.imagePostRequest(`/api/images/${filename}`, buffer);

								this.confirmFieldEdit(filename, true, 'picture', event.currentTarget);
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
				{this.state.currentCard === undefined ? (
					<div className="blank-holder">{this.state.error ? <p>Could not find card</p> : <img src="/blank.svg" />}</div>
				) : (
					cardPanel(this.state.currentCard, this.state.parts)
				)}
			</div>
		);
	}
}

const searchParams = new URLSearchParams(window.location.search);
const initialId = searchParams.get('id');

reactDom.render(<EditPage initialId={initialId === null ? undefined : +initialId} initialWord={searchParams.get('word') ?? undefined} />, document.body);
