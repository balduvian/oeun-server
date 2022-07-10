import { useEffect, useState } from 'react';
import { Card, MessageResponse, Part, ResultType } from './types';
import * as util from './util';
import EditPanel from './editPanel';
import { getParts } from './partsBadges';
import ErrorDisplay from './errorDisplay';

type Props = {
	mode: ResultType;
	id: number;
	setWord: (word: string) => void;
	setRoute: (route: string) => void;
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

const CardsPage = ({ mode, id, setWord, setRoute }: Props) => {
	const [parts, setParts] = useState<Part[]>([]);
	const [cards, setCards] = useState<Card[]>([]);
	const [cardsWord, setCardsWord] = useState('');
	const [collectionSize, setCollectionSize] = useState(0);
	const [error, setError] = useState(false);

	useEffect(() => {
		getParts(setParts, setError);

		const getCards = initialGetRequest(id, mode);
		if (getCards !== undefined) {
			getCards
				.then(([, data]) => {
					setCardsWord(data.cards[0].word ?? '');
					setCards(data.cards);
				})
				.catch(() => setError(true));
		} else {
			util.getRequest<{ value: number }>('/api/collection/size')
				.then(([, data]) => setCollectionSize(data.value))
				.catch(() => setError(true));
		}
	}, [mode, id]);

	return (
		<ErrorDisplay error={error}>
			{cards.length === 0 ? (
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
									.then(() =>
										setCards(
											cards.filter(
												card => card.id !== deletedId,
											),
										),
									)
									.catch(ex => console.log(ex))
							}
						/>
					))}
					{mode === ResultType.HOMONYM ? (
						<button
							className="add-button"
							onClick={() => {
								setWord(cardsWord);
								setRoute('/new');
							}}
						>
							+
						</button>
					) : null}
				</>
			)}
		</ErrorDisplay>
	);
};

export default CardsPage;
