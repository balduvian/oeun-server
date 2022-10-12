import React from 'react';
import {
	Part,
	CardPostResponse,
	Setter,
	EditingCard,
	UploadCard,
} from './types';
import * as util from './util';
import {
	composingEvents,
	doBracketing,
	isComposing,
	setSelection,
} from './korInput';
import {
	EbetButton,
	EbetFormField,
	EbetInput,
	EbetLabel,
	EbetPictureInput,
	EbetSelect,
} from './ebetUi';
import { createGo, Go } from './go';

type NewCardFieldProps = {
	value: string;
	error: boolean;
	setValue: (value: string) => void;
	label: string;
};

const NewCardField = React.memo(
	({ value, error, setValue, label }: NewCardFieldProps) => (
		<EbetFormField>
			<EbetLabel text={label} />
			<EbetInput
				value={value}
				error={error}
				events={{
					...composingEvents,
					onKeyDown: event => {
						if (isComposing(event)) return;

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
				}}
			/>
		</EbetFormField>
	),
);

type NewPartFieldProps = {
	value: string;
	setValue: (value: string) => void;
	parts: Part[];
};

const NewPartField = React.memo(
	({ value, setValue, parts }: NewPartFieldProps) => (
		<EbetFormField>
			<EbetLabel text="Part of speech" />
			<EbetSelect
				options={[{ id: '', english: '' }, ...parts].map(part => ({
					value: part.id,
					text: part.english,
				}))}
				value={value}
				onChange={value => setValue(value)}
			/>
		</EbetFormField>
	),
);

const realValue = (value: string) => {
	const trimmed = value.trim();
	return trimmed.length === 0 ? undefined : trimmed;
};

type Props = {
	setSearchValue: (searchValue: string) => void;
	goTo: (go: Go) => void;
	parts: Part[];
	setError: Setter<boolean>;
	card: EditingCard;
	setCard: Setter<EditingCard>;
};

export const NewPage = ({
	setSearchValue,
	goTo,
	parts,
	setError,
	card,
	setCard,
}: Props) => {
	const realWord = realValue(card.word);
	const realDefinition = realValue(card.definition);
	const realPicture = realValue(card.picture);

	const confirm = () => {
		if (realWord !== undefined && realDefinition !== undefined) {
			const uploadCard: UploadCard = {
				id: card.id,
				word: realWord,
				part: realValue(card.part),
				definition: realDefinition,
				sentence: realValue(card.sentence),
				picture: realValue(card.picture),
				badges: [],
				inAnki: card.inAnki,
			};

			util.putRequest<CardPostResponse>('/api/collection', uploadCard)
				.then(({ word, url }) => {
					setSearchValue(word);
					goTo(createGo(url));
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
		<div id="immr-card-panel">
			<NewCardField
				value={card.word}
				error={realWord === undefined}
				setValue={value => updateField('word', value)}
				label="Word *"
			/>
			<NewPartField
				value={card.part}
				setValue={value => updateField('part', value)}
				parts={parts}
			/>
			<NewCardField
				value={card.definition}
				error={realDefinition === undefined}
				setValue={value => updateField('definition', value)}
				label="Definition *"
			/>
			<NewCardField
				value={card.sentence}
				error={false}
				setValue={value => updateField('sentence', value)}
				label="Sentence"
			/>
			<EbetFormField>
				<EbetLabel text="Picture" />
				<EbetPictureInput
					src={
						realPicture === undefined
							? undefined
							: `/api/images/cards/${realPicture}`
					}
					onDelete={() => updateField('picture', '')}
					onPaste={async buffer => {
						try {
							updateField(
								'picture',
								await util.imagePostRequest<string>(
									'/api/images/cards',
									buffer,
								),
							);
						} catch (err) {
							console.log(err);
						}
					}}
				/>
			</EbetFormField>
			<EbetFormField>
				<EbetButton
					text={card.inAnki ? 'In anki' : 'Not in Anki'}
					onClick={() => updateField('inAnki', false)}
					disabled={!card.inAnki}
				/>
			</EbetFormField>
			<div className="button-grid">
				<EbetButton
					text="Cancel"
					onClick={() => goTo(createGo('/cards'))}
				/>
				<EbetButton text="Confirm" onClick={confirm} />
			</div>
		</div>
	);
};

export default NewPage;
