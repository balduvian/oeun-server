import { Card, MessageResponse, Part, ResultType, Setter } from './types';
import * as util from './util';
import { getParts } from './partsBadges';
import CardPanel from './cardPanel';
import { createGo, Go } from './go';
import { CardDisplay } from './cardDisplay';
import { Settings } from './settings';
import SettingsPage from './settingsPage';

const initialGetRequest = (id: number, mode: ResultType) => {
	if (mode === ResultType.CARD) {
		return util.getRequest<{ cards: Card[] }>(
			`/api/collection/homonym/card/${id}`,
		);
	} else if (mode === ResultType.HOMONYM) {
		return util.getRequest<{ cards: Card[] }>(
			`/api/collection/homonym/${id}`,
		);
	} else if (mode === ResultType.LATEST) {
		return util.getRequest<{ cards: Card[] }>('/api/collection/latest');
	} else if (mode === ResultType.RANDOM) {
		return util.getRequest<{ cards: Card[] }>('/api/collection/random');
	} else {
		return undefined;
	}
};

export const onGoCards = (
	id: number,
	mode: ResultType,
	setParts: Setter<Part[]>,
	setError: Setter<boolean>,
	setCards: Setter<Card[] | undefined>,
	setCollectionSize: Setter<number>,
) => {
	setCards(undefined);
	getParts(setParts, setError);

	const getCards = initialGetRequest(id, mode);
	if (getCards !== undefined) {
		getCards
			.then(data => {
				setCards(data.cards);
			})
			.catch(() => setError(true));
	} else {
		setCards([]);
		util.getRequest<number>('/api/collection/size')
			.then(size => setCollectionSize(size))
			.catch(() => setError(true));
	}
};

type Props = {
	goTo: (go: Go) => void;
	cards: Card[];
	setCards: Setter<Card[]>;
	collectionSize: number;
	parts: Part[];
	settings: Settings;
};

const CardsPage = ({
	goTo,
	cards,
	setCards,
	collectionSize,
	parts,
	settings,
}: Props) =>
	cards.length === 0 ? (
		<div className="blank-holder">
			<div className="image-holder">
				<CardDisplay cards={collectionSize} />
			</div>
		</div>
	) : (
		<>
			{cards.map(card => (
				<CardPanel
					key={card.id}
					card={card}
					parts={parts}
					onDelete={deletedId =>
						util
							.deleteRequest<MessageResponse>(
								`/api/collection/${deletedId}`,
							)
							.then(() => {
								const newCards = cards.filter(
									card => card.id !== deletedId,
								);
								if (newCards.length === 0) {
									goTo(createGo('/cards'));
								} else {
									setCards(newCards);
								}
							})
							.catch(console.error)
					}
					onAnki={
						settings.deckName === null ||
						settings.modelName === null
							? undefined
							: ankiId =>
									util
										.postRequest<MessageResponse>(
											`/api/anki/${ankiId}`,
											{},
										)
										.then(() => {
											const modifyCard = cards.find(
												card => card.id === ankiId,
											);
											if (modifyCard !== undefined) {
												modifyCard.inAnki = true;
											}

											setCards([...cards]);
										})
					}
					goTo={goTo}
				/>
			))}
		</>
	);

export default CardsPage;
