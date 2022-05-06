import * as react from 'react';
import { WindowEvent } from './windowEvent';
import { Card, EditHistory, Part, Editing, MessageResponse } from './types';
import * as util from './util';
import * as shared from './shared';

export type Props = {
	card: Card;
	parts: Part[];

	onDelete: (id: number) => void;
};

export type State = {
	editHistory: EditHistory;
	editing: Editing;
};

export class EditPanel extends react.Component<Props, State> {
	constructor(props: Props) {
		super(props);

		this.setState;
		this.state = {
			editHistory: [],
			editing: {},
		};
	}

	/**
	 * @param newString set to undefined if you wish to not edit
	 */
	confirmFieldEdit(
		newString: string | undefined,
		nullable: boolean,
		forField: keyof Card,
		eventTarget: (HTMLOrSVGElement & ElementContentEditable & Node) | undefined,
	) {
		eventTarget?.blur();

		const card = this.props.card;
		const history = this.state.editHistory;
		const previousValue = this.editingInitial(forField);

		if (newString === undefined) {
			(card[forField] as string | undefined) = previousValue;

			const value = (eventTarget as any)?.value;
			if (value !== undefined) {
				(eventTarget as any).value = previousValue;
			} else {
				(eventTarget as any).textContent = previousValue;
			}
		} else {
			let filtered = this.realValue(newString);

			if ((filtered !== undefined || nullable) && previousValue !== filtered) {
				/* first add the current value to history */
				history.push({ field: forField, value: card[forField] as string | undefined });

				/* modify card with new value */
				(card[forField] as string | undefined) = filtered;

				this.databaseChange(card.id, { [forField]: filtered });
			}
		}

		/* currentCards and editHistory already modified */
		this.setState(this.setEditing(forField, '', false));
	}

	editingInitial(field: string) {
		return this.state.editing[field]?.initial;
	}
	isEditing(field: string) {
		return this.state.editing[field]?.editing ?? false;
	}
	setEditing(field: string, initial: string | undefined, value: boolean) {
		this.state.editing[field] = { initial, editing: value };
		return { editing: this.state.editing };
	}

	realValue(value: string) {
		let filtered = value.trim();
		return filtered?.length === 0 ? undefined : filtered;
	}

	databaseChange(id: number, obj: { [key: string]: any }) {
		util.patchRequest<MessageResponse>(
			'/api/collection',
			Object.assign(
				{
					id: id,
				},
				obj,
			),
		).then(([code, data]) => console.log(code, data));
	}

	editDropdown(part: string | undefined, parts: Part[]) {
		let cancelBlur = false;
		return (
			<select
				className={`immr-part-edit ${part === undefined ? 'no-part' : ''}`}
				onKeyDown={event => {
					if (event.code === 'Escape' || (event.code === 'KeyZ' && event.ctrlKey)) {
						event.stopPropagation();
						event.preventDefault();
						cancelBlur = true;

						this.confirmFieldEdit(undefined, true, 'part', event.currentTarget);
					} else if (event.code === 'Enter') {
						event.preventDefault();
						cancelBlur = true;

						this.confirmFieldEdit(event.currentTarget.value, true, 'part', event.currentTarget);
					}
				}}
				onChange={event => {
					cancelBlur = true;
					this.confirmFieldEdit(event.currentTarget.value, true, 'part', event.currentTarget);
				}}
				onBlur={event => {
					if (!cancelBlur) {
						this.confirmFieldEdit(event.currentTarget.value, true, 'part', event.currentTarget);
					}
					cancelBlur = false;
				}}
				onFocus={event => this.setState(this.setEditing('part', this.realValue(event.currentTarget.value), true))}
			>
				{shared.partOptions(parts, part)}
			</select>
		);
	}

	editField(className: string, style: react.CSSProperties, editingValue: string | undefined, displayValue: any, nullable: boolean, forField: keyof Card) {
		let cancelBlur = false;
		let cancelTyping = false;
		return (
			<p
				className={`immr-card-edit ${className}`}
				style={style}
				role="textbox"
				contentEditable
				suppressContentEditableWarning={true}
				tabIndex={100}
				onCompositionStart={() => (cancelTyping = true)}
				onCompositionEnd={() => (cancelTyping = false)}
				onKeyDown={event => {
					if (cancelTyping) return;

					if (event.code === 'Escape' || (event.code === 'KeyZ' && event.ctrlKey)) {
						event.stopPropagation();
						event.preventDefault();
						cancelBlur = true;

						this.confirmFieldEdit(undefined, nullable, forField, event.currentTarget);
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
				onFocus={event => this.setState(this.setEditing(forField, this.realValue(event.currentTarget.textContent as string), true))}
			>
				{this.isEditing(forField) ? editingValue ?? '' : displayValue}
			</p>
		);
	}

	render() {
		const { card } = this.props;
		const highlights = card.sentence === undefined ? undefined : util.strToHighlights(card.sentence);

		return (
			<div id="immr-card-panel">
				<WindowEvent
					eventName="keydown"
					callBack={event => {
						if (event.code === 'KeyZ' && event.ctrlKey) {
							event.preventDefault();

							const card = this.props.card;
							const history = this.state.editHistory;
							const lastEdit = history.pop();

							if (lastEdit === undefined) return;

							(card[lastEdit.field] as string | undefined) = lastEdit.value;

							this.setState({});

							this.databaseChange(card.id, { [lastEdit.field]: lastEdit.value });
						}
					}}
				></WindowEvent>
				<div className="immr-card-row">
					{this.editField('big', { fontWeight: 'bold' }, card.word, card.word, false, 'word')}
					{this.editDropdown(card.part, this.props.parts)}
					<button className="delete-button" onClick={() => this.props.onDelete(this.props.card.id)}>
						X
					</button>
				</div>
				<div className="immr-card-row">{this.editField('small', {}, card.definition, card.definition, false, 'definition')}</div>

				{this.editField(
					'immr-card-sentence',
					{},
					card.sentence,
					highlights === undefined ? <span /> : highlights.map(({ part, highlight }) => <span className={highlight ? 'highlight' : ''}>{part}</span>),
					true,
					'sentence',
				)}
				{shared.pictureInput(
					'image-container',
					<input
						readOnly
						onFocus={event => this.setState(this.setEditing('picture', this.realValue(event.currentTarget.value), true))}
						onBlur={() => this.setState(this.setEditing('picture', '', false))}
						onKeyDown={event => {
							if (event.code === 'Delete') {
								event.preventDefault();
								this.confirmFieldEdit('', true, 'picture', event.currentTarget);
							} else if (event.code === 'Escape') {
								event.preventDefault();
								this.confirmFieldEdit(undefined, true, 'picture', event.currentTarget);
							}
						}}
						onPaste={async event => {
							event.preventDefault();

							const [buffer, filename] = await shared.onPasteImage(event);

							const [code, data] = await util.imagePostRequest<MessageResponse>(`/api/images/${filename}`, buffer);

							if (util.isGood(code, data)) {
								this.confirmFieldEdit(filename, true, 'picture', event.currentTarget);
							} else {
								console.log(data.error);
							}
						}}
					></input>,
					card.picture,
				)}
			</div>
		);
	}
}
