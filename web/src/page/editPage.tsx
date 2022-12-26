import React from 'react';
import {
	Part,
	CardPutResponse,
	Setter,
	EditingCard,
	UploadCard,
} from '../types';
import * as util from '../util';
import {
	composingEvents,
	doBracketing,
	isComposing,
	setSelection,
} from '../korInput';
import {
	EbetButton,
	EbetFormField,
	EbetInput,
	EbetLabel,
	EbetPictureInput,
} from '../ebetUi';
import { createGo, Go } from '../go';
import { warn } from '../toast';

const getElementByTabIndex = (index: number) =>
	[
		...document.getElementsByTagName('input'),
		...document.getElementsByTagName('button'),
	].find(element => element.tabIndex === index);

type NewCardFieldProps = {
	value: string;
	error?: boolean;
	setValue: (value: string) => void;
	label: string;
	tabIndex: number;
	confirm: (() => void) | undefined;
} & JSX.IntrinsicElements['input'];

const NewCardField = React.memo(
	({
		value,
		error = false,
		setValue,
		label,
		tabIndex,
		confirm,
		...rest
	}: NewCardFieldProps) => (
		<EbetFormField>
			<EbetLabel text={label} />
			<EbetInput
				value={value}
				error={error}
				events={{
					tabIndex,
					...composingEvents,
					onKeyDown: event => {
						if (isComposing(event)) return;

						if (event.key === 'Enter') {
							event.preventDefault();
							if (confirm === undefined) {
								getElementByTabIndex(tabIndex + 1)?.focus();
							} else {
								confirm();
							}
							return;
						}

						const bracketing = doBracketing(event);
						if (bracketing !== undefined) {
							setSelection(event, bracketing);
							setValue(bracketing.text);
						}
					},
					onInput: event => {
						const newValue = event.currentTarget.value;
						setValue(newValue);
					},
					...rest,
				}}
			/>
		</EbetFormField>
	),
);

type NewPartFieldProps = {
	value: string;
	setValue: (value: string) => void;
	parts: Part[];
	tabIndex: number;
};

const NewPartField = ({
	value,
	setValue,
	parts,
	tabIndex,
}: NewPartFieldProps) => {
	const [active, setActive] = React.useState(false);
	return (
		<EbetFormField>
			{!active ? null : (
				<div className="part-dropdown">
					{parts.map(part => (
						<div
							key={part.id}
							className={`part-entry ${
								part.id === value ? 'selected' : ''
							}`}
							data-id={part.id}
						>
							<b>{part.keybind}</b>
							<span>{part.english}</span>
						</div>
					))}
				</div>
			)}
			<EbetLabel text="Part of speech" />
			<EbetInput
				value={
					value === ''
						? ''
						: parts.find(part => part.id === value)?.english ??
						  '???'
				}
				events={{
					tabIndex,
					readOnly: true,
					onKeyDown: event => {
						const key = event.key.toLowerCase();
						if (key === 'tab') return;

						event.preventDefault();

						if (key === 'enter') {
							getElementByTabIndex(tabIndex + 1)?.focus();
							return;
						}

						if (
							key === 'backspace' ||
							key === 'delete' ||
							key === 'escape'
						)
							return setValue('');

						const movement =
							key === 'arrowup'
								? -1
								: key === 'arrowdown'
								? 1
								: 0;
						if (movement !== 0) {
							let index = parts.findIndex(
								part => part.id === value,
							);
							if (index === -1) return setValue(parts[0].id);
							setValue(
								parts[util.mod(index + movement, parts.length)]
									.id,
							);
						}
						const newPart = parts.find(
							part => part.keybind === key,
						);
						if (newPart !== undefined) setValue(newPart.id);
					},
					onFocus: () => setActive(true),
					onBlur: () => setActive(false),
				}}
			/>
		</EbetFormField>
	);
};

const editingCardReady = (card: EditingCard) =>
	realValue(card.word) !== undefined &&
	realValue(card.definition) !== undefined;

const editingCardComplete = (card: EditingCard) =>
	!realEmpty(card.word) &&
	card.part !== '' &&
	!realEmpty(card.definition) &&
	!realEmpty(card.sentence) &&
	card.picture !== '';

const realValue = (value: string) => {
	const trimmed = value.trim();
	return trimmed.length === 0 ? undefined : trimmed;
};
const realEmpty = (value: string) => {
	const trimmed = value.trim();
	return trimmed.length === 0;
};

type Props = {
	setSearchValue: (searchValue: string) => void;
	goTo: (go: Go) => void;
	parts: Part[];
	setError: Setter<boolean>;
	card: EditingCard;
	setCard: Setter<EditingCard>;
	uploadCardImage: (buffer: ArrayBuffer | string) => Promise<string>;
};

export const EditPage = ({
	setSearchValue,
	goTo,
	parts,
	setError,
	card,
	setCard,
	uploadCardImage,
}: Props) => {
	const [wasInAnki] = React.useState(card.anki);

	const allReady = editingCardReady(card);
	const allComplete = editingCardComplete(card);

	const confirm = () => {
		const realWord = realValue(card.word);
		const realDefinition = realValue(card.definition);

		if (realWord !== undefined && realDefinition !== undefined) {
			const uploadCard: UploadCard = {
				id: card.id,
				word: realWord,
				part: realValue(card.part),
				definition: realDefinition,
				sentence: realValue(card.sentence),
				picture: realValue(card.picture),
				badges: [],
				anki: card.anki,
			};

			util.putRequest<CardPutResponse>('/api/collection', uploadCard)
				.then(({ word, url, warnings }) => {
					setSearchValue(word);
					goTo(createGo(url));
					warnings.forEach(warning => warn(warning));
				})
				.catch(() => setError(true));
		}
	};

	const updateField = <Key extends keyof EditingCard>(
		key: Key,
		value: EditingCard[Key],
	) => {
		card[key] = value;
		setCard({ ...card });
	};

	return (
		<div className="standard-sheet">
			<NewCardField
				value={card.word}
				error={realEmpty(card.word)}
				setValue={value => updateField('word', value)}
				label="Word"
				tabIndex={1}
				confirm={allComplete ? confirm : undefined}
				autoFocus
			/>
			<NewPartField
				value={card.part}
				setValue={value => updateField('part', value)}
				parts={parts}
				tabIndex={2}
			/>
			<NewCardField
				value={card.definition}
				error={realEmpty(card.definition)}
				setValue={value => updateField('definition', value)}
				label="Definition"
				tabIndex={3}
				confirm={allComplete ? confirm : undefined}
			/>
			<NewCardField
				value={card.sentence}
				setValue={value => updateField('sentence', value)}
				label="Sentence"
				tabIndex={4}
				confirm={allComplete ? confirm : undefined}
			/>
			<EbetFormField>
				<EbetLabel text="Picture" />
				<EbetPictureInput
					src={
						realEmpty(card.picture)
							? undefined
							: `/api/images/cards/${card.picture}`
					}
					onDelete={() => updateField('picture', '')}
					onPaste={async buffer => {
						try {
							updateField(
								'picture',
								await uploadCardImage(buffer),
							);
						} catch (err) {
							console.log(err);
						}
					}}
					events={{ tabIndex: 5 }}
				/>
			</EbetFormField>
			{wasInAnki ? (
				<EbetFormField>
					<EbetButton
						text={
							card.anki
								? 'Remove from Anki'
								: 'Will be removed from anki'
						}
						onClick={() => updateField('anki', !card.anki)}
						events={{ tabIndex: -1 }}
					/>
				</EbetFormField>
			) : null}
			<div className="button-grid">
				<EbetButton
					text="Cancel"
					onClick={() => goTo(createGo('/cards'))}
					events={{ tabIndex: 6 }}
				/>
				<EbetButton
					text="Confirm"
					onClick={confirm}
					positive={allComplete}
					disabled={!allReady}
				/>
			</div>
		</div>
	);
};

export default EditPage;