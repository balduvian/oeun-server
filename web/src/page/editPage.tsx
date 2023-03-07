import React from 'react';
import {
	Part,
	CardPutResponse,
	Setter,
	EditingCard,
	UploadCard,
	Badge,
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
import { createGo, Nav } from '../go';
import { warn } from '../toast';
import { highlightString } from '../highlight';

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
	confirm: (() => void) | undefined;
};

const NewPartField = ({
	value,
	setValue,
	parts,
	tabIndex,
	confirm,
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
							if (confirm !== undefined) return confirm();
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

const BadgesSelector = ({
	badges,
	selected,
	setSelection,
}: {
	badges: Badge[];
	selected: string[];
	setSelection: (selection: string[]) => void;
}) => {
	return (
		<div className="badges-selector">
			{badges.map(({ id, displayName, picture }) => {
				const isSelected = selected.includes(id);
				return (
					<div
						className={`card-badge ${isSelected ? 'selected' : ''}`}
						onClick={() => {
							if (isSelected) {
								selected.splice(selected.indexOf(id), 1);
								setSelection(selected);
							} else {
								selected.push(id);
								setSelection(selected);
							}
						}}
					>
						<img src={`/api/images/badges/${picture}`} />
						<div className="badge-tooltip">{displayName}</div>
					</div>
				);
			})}
		</div>
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
	card.pictureURL !== '';

const realValue = (value: string) => {
	const trimmed = value.trim();
	return trimmed.length === 0 ? undefined : trimmed;
};
const realEmpty = (value: string) => {
	const trimmed = value.trim();
	return trimmed.length === 0;
};

const BASE_PICTURE_URL = '/api/images/cards/';

export const convertToPictureURL = (picture: string) =>
	`${BASE_PICTURE_URL}${picture}`;

type Props = {
	setSearchValue: (searchValue: string) => void;
	nav: Nav;
	parts: Part[];
	badges: Badge[];
	card: EditingCard;
	setCard: Setter<EditingCard>;
};

export const EditPage = ({
	setSearchValue,
	nav,
	parts,
	badges,
	card,
	setCard,
}: Props) => {
	const [wasInAnki] = React.useState(card.anki);

	const allReady = editingCardReady(card);
	const allComplete = editingCardComplete(card);

	const confirm = () => {
		const realWord = realValue(card.word);
		const realDefinition = realValue(card.definition);

		if (realWord !== undefined && realDefinition !== undefined) {
			const realSentence = realValue(card.sentence);
			if (
				realSentence != null &&
				highlightString(realSentence).every(
					([, highlight]) => !highlight,
				)
			)
				return warn('Sentence contains no highlight');

			const uploadCard: UploadCard = {
				id: card.id,
				word: realWord,
				part: realValue(card.part),
				definition: realDefinition,
				sentence: realSentence,
				picture: util.stripPictureURL(
					card.pictureURL,
					BASE_PICTURE_URL,
				),
				badges: card.badges,
				anki: card.anki,
			};

			util.putRequest<CardPutResponse>('/api/collection', uploadCard)
				.then(({ word, url, warnings }) => {
					setSearchValue(word);
					nav.goTo(createGo(url));
					warnings.forEach(warning => warn(warning));
				})
				.catch(() => nav.setError(true));
		} else {
			const requireds = [
				...(realWord === undefined ? ['Word'] : []),
				...(realDefinition === undefined ? ['Definition'] : []),
			];
			warn(`value for ${requireds.join(' And ')} is required`);
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
				confirm={allComplete ? confirm : undefined}
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
					paste={true}
					src={
						realEmpty(card.pictureURL) ? undefined : card.pictureURL
					}
					onDelete={() => updateField('pictureURL', '')}
					onBuffer={async buffer => {
						updateField(
							'pictureURL',
							util.pngDataURL(util.bufferToBase64(buffer)),
						);
					}}
					events={{
						tabIndex: 5,
						onKeyDown: ({ key }) =>
							key === 'Enter' && allComplete
								? confirm()
								: undefined,
					}}
					aspectRatio={9 / 16}
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
			<BadgesSelector
				badges={badges}
				selected={card.badges}
				setSelection={badges => updateField('badges', badges)}
			/>
			<div className="button-grid">
				<EbetButton
					text="Cancel"
					onClick={() => nav.goTo(createGo('/cards'))}
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
