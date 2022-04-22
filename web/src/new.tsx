import * as react from 'react';
import * as reactDom from 'react-dom';
import { WindowEvent } from './windowEvent';
import { Card, NewCard, Part, NewField, MessageResponse, Homonym } from './types';
import * as util from './util';
import { SearchBox } from './searchBox';
import * as shared from './shared';

/* initial values from the URL */
type Props = {
	word: string | undefined;
	part: string | undefined;
	definition: string | undefined;
	sentence: string | undefined;
};

type State = {
	parts: Part[];
	badges: { [key: string]: string };

	newCard: NewCard;
};

class NewPage extends react.Component<Props, State> {
	constructor(props: Props) {
		super(props);

		const newCard = util.blankNewCard();
		newCard.word.value = props.word;
		newCard.part.value = props.part;
		newCard.definition.value = props.definition;
		newCard.sentence.value = props.sentence;

		this.state = {
			parts: [],
			badges: {},
			newCard: newCard,
		};

		shared.getPartsBadges().then(({ parts, badges }) => this.setState({ parts, badges }));
	}

	render() {
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
					{shared.partOptions(this.state.parts, initialNewCard.part.value)}
				</select>
			</div>
		);

		const newPictureField = (initialNewCard: NewCard) => (
			<div className="immr-card-row">
				<p className="new-caption">Picture</p>
				{shared.pictureInput(
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

							const [buffer, filename] = await shared.onPasteImage(event);
							const [code, data] = await util.imagePostRequest<MessageResponse>(`/api/images/${filename}`, buffer);

							if (util.isGood(code, data)) {
								if (initialNewCard.picture.ref.current !== null) initialNewCard.picture.ref.current.value = filename;
								this.state.newCard.picture.value = filename;
								this.setState({ newCard: this.state.newCard }, () => console.log(this.state.newCard));
							} else {
								console.log(data.error);
							}
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
						<button className="new-button" onClick={() => shared.goToNewPage('/edit', [])}>
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

									util.postRequest<Homonym>('/api/collection', uploadCard).then(([code, data]) => {
										if (util.isGood(code, data)) {
											shared.goToNewPage('/edit', [
												['id', data.id.toString()],
												['word', data.cards[0].word],
											]);
										} else {
											console.log(data.error);
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
				{shared.killCtrlZ()}
				<SearchBox
					searchValue=""
					onSearch={({ word, id }) =>
						shared.goToNewPage('/edit', [
							['id', id.toString()],
							['word', word],
						])
					}
				></SearchBox>
				{newCardPanel(this.state.newCard)}
			</div>
		);
	}
}

const searchParams = new URLSearchParams(window.location.search);

reactDom.render(
	<NewPage
		word={searchParams.get('word') ?? undefined}
		part={searchParams.get('part') ?? undefined}
		definition={searchParams.get('definition') ?? undefined}
		sentence={searchParams.get('sentence') ?? undefined}
	/>,
	document.body,
);
