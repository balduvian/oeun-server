import * as react from 'react';
import * as reactDom from 'react-dom';
import { WindowEvent } from './windowEvent';
import { Card, NewCard, Part, NewField, MessageResponse, Homonym } from './types';
import * as util from './util';
import { SearchBox } from './searchBox';
import * as shared from './shared';
import { getParts } from './partsBadges';

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

		const retrievedParts = getParts();

		this.state = {
			parts: Array.isArray(retrievedParts) ? retrievedParts : [],
			badges: {},
			newCard: newCard,
		};

		if (retrievedParts instanceof Promise) {
			retrievedParts.then(parts => this.setState({ parts }));
		}
	}

	isHangul(code: number) {
		return (code >= 0x3131 && code <= 0x318e) || (code >= 0xac00 && code <= 0xd7a3);
	}

	findStarStart(text: string) {
		if (text.length === 0) return -1;
		if (!this.isHangul(text.charCodeAt(text.length - 1))) return -1;

		for (let i = text.length - 2; i >= 0; --i) {
			if (!this.isHangul(text.charCodeAt(i))) return i + 1;
		}

		return 0;
	}

	render() {
		const newCardField = (initialNewCard: NewCard, cardField: keyof NewCard, prettyName: string) => {
			const field = initialNewCard[cardField] as NewField<HTMLInputElement>;
			return (
				<div className="immr-card-row">
					<p className={`new-caption ${field.error ? 'error' : ''}`}>{prettyName}</p>
					<input
						ref={field.ref}
						className="new-card-field"
						onKeyDown={event => {
							if (event.key === '*') {
								const text = event.currentTarget.value;
								const start = event.currentTarget.selectionStart;
								const end = event.currentTarget.selectionEnd;
								if (start === null || end === null) return;
								if (start === end && end === text.length) {
									const startIndex = this.findStarStart(text);
									if (startIndex !== -1) {
										event.preventDefault();
										event.currentTarget.value = text.substring(0, startIndex) + '**' + text.substring(startIndex) + '**';
									}
								} else if (start !== end) {
									event.preventDefault();
									event.currentTarget.value = text.substring(0, start) + '**' + text.substring(start, end) + '**' + text.substring(end);
									event.currentTarget.setSelectionRange(end + 4, end + 4);
								}
							}
						}}
					/>
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
					onSearch={selection => {
						if (selection === undefined) {
							shared.goToNewPage('/edit', []);
						} else {
							shared.goToNewPage('/edit', [
								['id', selection.id.toString()],
								['word', selection.word],
							]);
						}
					}}
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
