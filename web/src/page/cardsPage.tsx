import {
	Card,
	CardsState,
	CollectionSize,
	DeleteResponse,
	Part,
	ResultType,
	Setter,
} from '../types';
import * as util from '../util';
import { getParts } from '../partsBadges';
import CardPanel, { AnkiMode } from '../component/cardPanel';
import { createGo, Nav } from '../go';
import { CardDisplay } from '../component/cardDisplay';
import { Settings } from '../settings';
import { warn } from '../toast';

const initialGetRequest = (id: number, mode: ResultType) => {
	if (mode === ResultType.CARD) {
		return util.getRequest<CardsState>(
			`/api/collection/homonym/card/${id}`,
		);
	} else if (mode === ResultType.HOMONYM) {
		return util.getRequest<CardsState>(`/api/collection/homonym/${id}`);
	} else if (mode === ResultType.LATEST) {
		return util.getRequest<CardsState>('/api/collection/latest');
	} else if (mode === ResultType.RANDOM) {
		return util.getRequest<CardsState>('/api/collection/random');
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
	setCollectionSize: Setter<CollectionSize>,
) => {
	setCards(undefined);
	getParts(setParts, setError);

	const getCards = initialGetRequest(id, mode);
	if (getCards !== undefined) {
		getCards
			.then(data => {
				setCards(data.cards);
				setCollectionSize(data.collectionSize);
			})
			.catch(() => setError(true));
	} else {
		setCards([]);
		util.getRequest<CollectionSize>('/api/collection/size')
			.then(size => setCollectionSize(size))
			.catch(() => setError(true));
	}
};

type Props = {
	nav: Nav;
	cards: Card[];
	setCards: Setter<Card[]>;
	collectionSize: CollectionSize | undefined;
	setCollectionSize: Setter<CollectionSize>;
	parts: Part[];
	settings: Settings;
};

const CardsPage = ({
	nav,
	cards,
	setCards,
	collectionSize,
	setCollectionSize,
	parts,
	settings,
}: Props) => {
	return cards.length === 0 ? (
		<div className="blank-holder">
			<div className="image-holder">
				<CardDisplay cards={collectionSize?.size} />
			</div>
		</div>
	) : (
		<div className="standard-sheet">
			{cards.map((card, index) => (
				<CardPanel
					key={card.id}
					card={card}
					parts={parts}
					index={index}
					onDelete={deletedId =>
						util
							.deleteRequest<DeleteResponse>(
								`/api/collection/${deletedId}`,
							)
							.then(({ warnings }) => {
								warnings.forEach(warning => warn(warning));
								const newCards = cards.filter(
									card => card.id !== deletedId,
								);
								if (newCards.length === 0) {
									nav.goTo(createGo('/cards'));
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
							: (ankiId, mode) =>
									util
										.postRequest<CardsState>(
											mode === AnkiMode.ADD
												? `/api/anki/add/${ankiId}`
												: `/api/anki/sync/${ankiId}`,
											{},
										)
										.then(
											({
												collectionSize,
												cards: [updatedCard],
											}) => {
												setCollectionSize(
													collectionSize,
												);
												const replaceIndex =
													cards.findIndex(
														card =>
															card.id ===
															updatedCard.id,
													);
												if (replaceIndex !== -1) {
													const list = [...cards];
													list[replaceIndex] =
														updatedCard;
													setCards(list);
												}
											},
										)
					}
					nav={nav}
				/>
			))}
		</div>
	);
};

export default CardsPage;
