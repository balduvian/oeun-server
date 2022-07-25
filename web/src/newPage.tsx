import React, { useState } from 'react';
import { Card, Part, MessageResponse, CardPostResponse, Setter } from './types';
import * as util from './util';
import * as shared from './shared';
import {
	composingEvents,
	doBracketing,
	isComposing,
	setSelection,
} from './korInput';

type Props = {
	setSearchValue: (searchValue: string) => void;
	word: string;
	setWord: Setter<string>;
	goTo: (url: string) => void;
	parts: Part[];
	setError: Setter<boolean>;
};

type NewCardFieldProps = {
	value: string;
	error: boolean;
	setValue: (value: string) => void;
	prettyName: string;
};

const NewCardField = React.memo(
	({ value, error, setValue, prettyName }: NewCardFieldProps) => (
		<div className="immr-card-row">
			<p className={`new-caption ${error ? 'error' : ''}`}>
				{prettyName}
			</p>
			<input
				{...composingEvents}
				onKeyDown={event => {
					if (isComposing(event)) return;

					const bracketing = doBracketing(event);
					if (bracketing !== undefined) {
						setSelection(event, bracketing);
						setValue(bracketing.text);
					}
				}}
				className="new-card-field"
				value={value ?? ''}
				onInput={event => {
					const newValue = event.currentTarget.value;
					setValue(newValue);
				}}
			/>
		</div>
	),
);

type NewPartFieldProps = {
	value: string;
	setValue: (value: string) => void;
	parts: Part[];
};

const NewPartField = React.memo(
	({ value, setValue, parts }: NewPartFieldProps) => (
		<div className="immr-card-row">
			<p className="new-caption">Part of speech</p>
			<select
				className="new-select"
				value={value}
				onChange={event => {
					setValue(event.currentTarget.value);
				}}
			>
				{shared.partOptions(parts)}
			</select>
		</div>
	),
);

type NewPictureFieldProps = {
	value: string;
	setValue: (value: string) => void;
};

const NewPictureField = React.memo(
	({ value, setValue }: NewPictureFieldProps) => (
		<div className="immr-card-row">
			<p className="new-caption">Picture</p>
			{shared.pictureInput(
				'image-container',
				<input
					readOnly
					onKeyDown={event => {
						if (event.code === 'Delete') {
							event.preventDefault();
							setValue('');
						}
					}}
					onPaste={async event => {
						event.preventDefault();
						try {
							const [buffer, filename] =
								await shared.onPasteImage(event);

							await util.imagePostRequest<MessageResponse>(
								`/api/images/${filename}`,
								buffer,
							);

							setValue(filename);
						} catch (err) {
							console.log(err);
						}
					}}
				/>,
				value === '' ? undefined : value,
			)}
		</div>
	),
);

export const NewPage = ({
	word,
	setWord,
	setSearchValue,
	goTo,
	parts,
	setError,
}: Props) => {
	const [part, setPart] = useState('');
	const [definition, setDefinition] = useState('');
	const [sentence, setSentence] = useState('');
	const [picture, setPicture] = useState('');
	const [fieldErrors, setFieldErrors] = useState<
		[boolean, boolean, boolean, boolean, boolean]
	>([false, false, false, false, false]);

	const clearErrors = () => {
		setFieldErrors([false, false, false, false, false]);
	};

	const makeFieldError = (i: number) => {
		setFieldErrors(arr => {
			arr[i] = true;
			return [...arr];
		});
	};

	const realValue = (value: string) => {
		const trimmed = value.trim();
		return trimmed === '' ? undefined : trimmed;
	};

	const create = () => {
		clearErrors();
		let foundError = false;

		const fields = [
			[word, false],
			[part, true],
			[definition, false],
			[sentence, true],
			[picture, true],
		] as const;

		for (let i = 0; i < fields.length; ++i) {
			const [fieldValue, nullable] = fields[i];

			if (!nullable && realValue(fieldValue) === undefined) {
				makeFieldError(i);
				foundError = true;
			}
		}

		if (!foundError) {
			const uploadCard: Card = {
				id: 0,
				word: word,
				part: realValue(part),
				definition: definition,
				sentence: realValue(sentence),
				picture: realValue(picture),
				date: new Date(),
				badges: [],
			};

			util.postRequest<CardPostResponse>(
				'/api/collection',
				uploadCard,
			).then(([code, data]) => {
				if (util.isGood(code, data)) {
					setSearchValue(data.word);
					goTo(data.url);
				} else {
					setError(true);
				}
			});
		}
	};

	return (
		<div id="immr-card-panel">
			<NewCardField
				value={word}
				error={fieldErrors[0]}
				setValue={setWord}
				prettyName="Word *"
			/>
			<NewPartField value={part} setValue={setPart} parts={parts} />
			<NewCardField
				value={definition}
				error={fieldErrors[2]}
				setValue={setDefinition}
				prettyName="Definition *"
			/>
			<NewCardField
				value={sentence}
				error={fieldErrors[3]}
				setValue={setSentence}
				prettyName="Sentence"
			/>
			<NewPictureField value={picture} setValue={setPicture} />
			<div className="immr-card-row">
				<div className="button-grid">
					<button
						className="new-button"
						onClick={() => goTo('/cards')}
					>
						Cancel
					</button>
					<button className="new-button" onClick={create}>
						Create
					</button>
				</div>
			</div>
		</div>
	);
};

export default NewPage;
