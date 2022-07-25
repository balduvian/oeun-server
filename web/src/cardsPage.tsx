import { Card, MessageResponse, Part, ResultType, Setter } from './types';
import * as util from './util';
import EditPanel from './editPanel';
import { getParts } from './partsBadges';

type Props = {
	mode: ResultType;
	goTo: (url: string) => void;

	cards: Card[];
	setCards: Setter<Card[]>;
	word: string;
	setWord: Setter<string>;
	collectionSize: number;
	parts: Part[];
};

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
	setWord: Setter<string>,
	setCards: Setter<Card[] | undefined>,
	setCollectionSize: Setter<number>,
) => {
	setCards(undefined);
	getParts(setParts, setError);

	const getCards = initialGetRequest(id, mode);
	if (getCards !== undefined) {
		getCards
			.then(([, data]) => {
				setWord(data.cards[0].word ?? '');
				setCards(data.cards);
			})
			.catch(() => setError(true));
	} else {
		setCards([]);
		util.getRequest<{ value: number }>('/api/collection/size')
			.then(([, data]) => setCollectionSize(data.value))
			.catch(() => setError(true));
	}
};

const CardsPage = ({
	mode,
	setWord,
	goTo,
	cards,
	setCards,
	word,
	collectionSize,
	parts,
}: Props) => {
	return cards.length === 0 ? (
		<div className="blank-holder">
			<div className="image-holder">
				<div className="size-display">{`${collectionSize} Cards`}</div>
				<img src="/blank.svg" />
			</div>
		</div>
	) : (
		<>
			{cards.map(card => (
				<EditPanel
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
								setCards(newCards);
								if (newCards.length === 0) {
									goTo('/cards');
								}
							})
							.catch(ex => console.log(ex))
					}
				/>
			))}
			{mode === ResultType.HOMONYM ? (
				<button
					className="add-button"
					onClick={() => {
						setWord(word);
						goTo('/new');
					}}
				>
					+
				</button>
			) : null}
		</>
	);
};

export default CardsPage;
