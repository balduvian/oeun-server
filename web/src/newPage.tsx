import { useEffect, useState } from 'react';
import {
	Card,
	NewCard,
	Part,
	NewField,
	MessageResponse,
	CardPostResponse,
} from './types';
import * as util from './util';
import * as shared from './shared';
import { getParts } from './partsBadges';
import KorInput from './korInput';
import ErrorDisplay from './errorDisplay';
import { useNavigate } from 'react-router-dom';

type Props = {
	setSearchValue: (searchValue: string) => void;
};

const newCardField = (
	newCard: NewCard,
	cardField: keyof NewCard,
	prettyName: string,
) => {
	const field = newCard[cardField] as NewField<HTMLInputElement>;
	return (
		<div className="immr-card-row">
			<p className={`new-caption ${field.error ? 'error' : ''}`}>
				{prettyName}
			</p>
			<KorInput
				smart={true}
				inputProps={{ className: 'new-card-field', ref: field.ref }}
			/>
		</div>
	);
};

const newPartField = (newCard: NewCard, parts: Part[]) => (
	<div className="immr-card-row">
		<p className="new-caption">Part of speech</p>
		<select
			ref={newCard.part.ref}
			className="new-select"
			value={newCard.part.value}
		>
			{shared.partOptions(parts)}
		</select>
	</div>
);

export const NewPage = ({ setSearchValue }: Props) => {
	const [parts, setParts] = useState<Part[]>([]);
	const [newCard, setNewCard] = useState<NewCard>(() => util.blankNewCard());
	const [error, setError] = useState(false);

	const navigate = useNavigate();

	useEffect(() => {
		getParts(setParts, setError);
	}, []);

	const newPictureField = (newCard: NewCard) => (
		<div className="immr-card-row">
			<p className="new-caption">Picture</p>
			{shared.pictureInput(
				'image-container',
				<input
					readOnly
					ref={newCard.picture.ref}
					onKeyDown={event => {
						if (event.code === 'Delete') {
							event.preventDefault();

							newCard.picture.value = '';
							setNewCard({ ...newCard });
						}
					}}
					onPaste={async event => {
						event.preventDefault();

						const [buffer, filename] = await shared.onPasteImage(
							event,
						);

						util.imagePostRequest<MessageResponse>(
							`/api/images/${filename}`,
							buffer,
						)
							.then(() => {
								if (newCard.picture.ref.current !== null)
									newCard.picture.ref.current.value =
										filename;
								newCard.picture.value = filename;
								setNewCard({ ...newCard });
							})
							.catch(ex => console.log(ex));
					}}
				/>,
				newCard.picture.value,
			)}
		</div>
	);

	const create = () => {
		let foundError = false;
		const fields = Object.keys(newCard) as (keyof NewCard)[];

		for (const fieldName of fields) {
			const field = newCard[fieldName];

			/* the real value which will be passed */
			field.value = field.ref.current?.value;
			if (field.value === '') field.value = undefined;

			if (field.value === undefined && !field.nullable) {
				field.error = true;
				foundError = true;
			}
		}

		if (foundError) {
			setNewCard({ ...newCard });
		} else {
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

			util.postRequest<CardPostResponse>(
				'/api/collection',
				uploadCard,
			).then(([code, data]) => {
				if (util.isGood(code, data)) {
					setSearchValue(data.word);
					navigate(data.url);
				} else {
					setError(true);
				}
			});
		}
	};

	return (
		<ErrorDisplay error={error}>
			<div id="immr-card-panel">
				{newCardField(newCard, 'word', 'Word *')}
				{newPartField(newCard, parts)}
				{newCardField(newCard, 'definition', 'Definition *')}
				{newCardField(newCard, 'sentence', 'Sentence')}
				{newPictureField(newCard)}
				<div className="immr-card-row">
					<div className="button-grid">
						<button
							className="new-button"
							onClick={() => navigate('/cards')}
						>
							Cancel
						</button>
						<button className="new-button" onClick={create}>
							Create
						</button>
					</div>
				</div>
			</div>
		</ErrorDisplay>
	);
};

export default NewPage;
