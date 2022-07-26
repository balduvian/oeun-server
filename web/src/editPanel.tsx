import * as react from 'react';
import WindowEvent from './windowEvent';
import { Card, EditHistory, Part, Editing, MessageResponse } from './types';
import * as util from './util';
import * as shared from './shared';
import {
	composingEvents,
	doBracketing,
	isComposing,
	setSelection,
} from './korInput';

type Props = {
	card: Card;
	parts: Part[];

	onDelete: (id: number) => void;
};

const EditPanel = ({ card, parts, onDelete }: Props) => {
	const [editing, setEditing] = react.useState<Editing>({});
	const [history, setHistory] = react.useState<EditHistory>([]);

	const highlights =
		card.sentence === undefined
			? undefined
			: util.strToHighlights(card.sentence);

	/**
	 * @param newString set to undefined if you wish to not edit
	 */
	const confirmFieldEdit = (
		newString: string | undefined,
		nullable: boolean,
		forField: keyof Card,
		eventTarget:
			| (HTMLOrSVGElement & ElementContentEditable & Node)
			| undefined,
	) => {
		eventTarget?.blur();

		const previousValue = editingInitial(forField);

		if (newString === undefined) {
			(card[forField] as string | undefined) = previousValue;

			const value = (eventTarget as any)?.value;
			if (value !== undefined) {
				(eventTarget as any).value = previousValue;
			} else {
				(eventTarget as any).textContent = previousValue;
			}
		} else {
			let filtered = realValue(newString);

			if (
				(filtered !== undefined || nullable) &&
				previousValue !== filtered
			) {
				/* first add the current value to history */
				history.push({
					field: forField,
					value: card[forField] as string | undefined,
				});

				/* modify card with new value */
				(card[forField] as string | undefined) = filtered;

				databaseChange(card.id, { [forField]: filtered });
			}
		}

		/* currentCards and editHistory already modified */
		setEditingField(forField, '', false);
	};

	const editingInitial = (field: string) => {
		return editing[field]?.initial;
	};
	const isEditing = (field: string) => {
		return editing[field]?.editing ?? false;
	};
	const setEditingField = (
		field: string,
		initial: string | undefined,
		value: boolean,
	) => {
		editing[field] = { initial, editing: value };
		setEditing({ ...editing });
	};

	const realValue = (value: string) => {
		let filtered = value.trim();
		return filtered?.length === 0 ? undefined : filtered;
	};

	const databaseChange = (id: number, obj: { [key: string]: any }) => {
		util.patchRequest<MessageResponse>('/api/collection', {
			id: id,
			...obj,
		});
	};

	const editDropdown = (part: string | undefined, parts: Part[]) => {
		let cancelBlur = false;
		return (
			<select
				className={`immr-part-edit ${
					part === undefined ? 'no-part' : ''
				}`}
				onKeyDown={event => {
					if (
						event.code === 'Escape' ||
						(event.code === 'KeyZ' && event.ctrlKey)
					) {
						event.stopPropagation();
						event.preventDefault();
						cancelBlur = true;

						confirmFieldEdit(
							undefined,
							true,
							'part',
							event.currentTarget,
						);
					} else if (event.code === 'Enter') {
						event.preventDefault();
						cancelBlur = true;

						confirmFieldEdit(
							event.currentTarget.value,
							true,
							'part',
							event.currentTarget,
						);
					}
				}}
				onChange={event => {
					cancelBlur = true;
					confirmFieldEdit(
						event.currentTarget.value,
						true,
						'part',
						event.currentTarget,
					);
				}}
				onBlur={event => {
					if (!cancelBlur) {
						confirmFieldEdit(
							event.currentTarget.value,
							true,
							'part',
							event.currentTarget,
						);
					}
					cancelBlur = false;
				}}
				onFocus={event =>
					setEditingField(
						'part',
						realValue(event.currentTarget.value),
						true,
					)
				}
				value={part ?? ''}
			>
				{shared.partOptions(parts)}
			</select>
		);
	};

	const editField = (
		className: string,
		style: react.CSSProperties,
		editingValue: string | undefined,
		displayValue: any,
		nullable: boolean,
		forField: keyof Card,
	) => {
		let cancelBlur = false;
		return (
			<p
				className={`immr-card-edit ${className}`}
				style={style}
				role="textbox"
				contentEditable
				suppressContentEditableWarning={true}
				tabIndex={100}
				{...composingEvents}
				onKeyDown={event => {
					if (isComposing(event)) return;

					const bracketing = doBracketing(event);
					if (bracketing !== undefined) {
						setSelection(event, bracketing);
					} else if (
						event.code === 'Escape' ||
						(event.code === 'KeyZ' && event.ctrlKey)
					) {
						event.stopPropagation();
						event.preventDefault();
						cancelBlur = true;

						confirmFieldEdit(
							undefined,
							nullable,
							forField,
							event.currentTarget,
						);
					} else if (event.code === 'Enter') {
						event.preventDefault();
						cancelBlur = true;

						confirmFieldEdit(
							event.currentTarget.textContent as string,
							nullable,
							forField,
							event.currentTarget,
						);
					}
				}}
				onBlur={event => {
					if (!cancelBlur) {
						confirmFieldEdit(
							event.currentTarget.textContent as string,
							nullable,
							forField,
							event.currentTarget,
						);
					}
					cancelBlur = false;
				}}
				onFocus={event =>
					setEditingField(
						forField,
						realValue(event.currentTarget.textContent as string),
						true,
					)
				}
			>
				{isEditing(forField) ? editingValue ?? '' : displayValue}
			</p>
		);
	};

	return (
		<div id="immr-card-panel">
			<WindowEvent
				eventName="keydown"
				callback={event => {
					if (event.code === 'KeyZ' && event.ctrlKey) {
						event.preventDefault();

						const lastEdit = history.pop();

						if (lastEdit === undefined) return;

						(card[lastEdit.field] as string | undefined) =
							lastEdit.value;

						setHistory(history);

						databaseChange(card.id, {
							[lastEdit.field]: lastEdit.value,
						});
					}
				}}
			/>
			<div className="immr-card-row">
				{editField(
					'big',
					{ fontWeight: 'bold' },
					card.word,
					card.word,
					false,
					'word',
				)}
				{editDropdown(card.part, parts)}
				<button
					className="delete-button"
					onClick={() => onDelete(card.id)}
				>
					X
				</button>
			</div>
			<div className="immr-card-row">
				{editField(
					'small',
					{},
					card.definition,
					card.definition,
					false,
					'definition',
				)}
			</div>

			{editField(
				'immr-card-sentence',
				{},
				card.sentence,
				highlights === undefined ? (
					<span />
				) : (
					highlights.map(({ part, highlight }, i) => (
						<span key={i} className={highlight ? 'highlight' : ''}>
							{part}
						</span>
					))
				),
				true,
				'sentence',
			)}
			{shared.pictureInput(
				'image-container',
				<input
					readOnly
					onFocus={event =>
						setEditingField(
							'picture',
							realValue(event.currentTarget.value),
							true,
						)
					}
					onBlur={() => setEditingField('picture', '', false)}
					onKeyDown={event => {
						if (event.code === 'Delete') {
							event.preventDefault();
							confirmFieldEdit(
								'',
								true,
								'picture',
								event.currentTarget,
							);
						} else if (event.code === 'Escape') {
							event.preventDefault();
							confirmFieldEdit(
								undefined,
								true,
								'picture',
								event.currentTarget,
							);
						}
					}}
					onPaste={async event => {
						event.preventDefault();

						const [buffer, filename] = await shared.onPasteImage(
							event,
						);

						util.imagePostRequest<MessageResponse>(
							`/api/images/cards/${filename}`,
							buffer,
						)
							.then(() =>
								confirmFieldEdit(
									filename,
									true,
									'picture',
									event.currentTarget,
								),
							)
							.catch(ex => console.log(ex));
					}}
				></input>,
				card.picture,
			)}
		</div>
	);
};

export default EditPanel;
