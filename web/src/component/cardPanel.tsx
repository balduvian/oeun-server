import React from 'react';
import { Card, Part } from '../types';
import * as util from '../util';
import { createGo, Go } from '../go';

type HighlightsProps = {
	sentence: string | undefined;
};

const Highlights = React.memo(({ sentence }: HighlightsProps) => {
	const highlights =
		sentence === undefined ? undefined : util.strToHighlights(sentence);

	return highlights === undefined ? (
		<span />
	) : (
		<>
			{highlights.map(({ part, highlight }, i) => (
				<span key={i} className={highlight ? 'highlight' : ''}>
					{part}
				</span>
			))}
		</>
	);
});

export enum AnkiMode {
	ADD,
	SYNC,
}

type Props = {
	card: Card;
	parts: Part[];
	index: number;
	onDelete: (id: number) => void;
	onAnki: ((id: number, mode: AnkiMode) => Promise<void>) | undefined;
	goTo: (go: Go) => void;
};

const CardPanel = ({ card, parts, index, onDelete, onAnki, goTo }: Props) => {
	const [ankiLoading, setAnkiLoading] = React.useState(false);

	return (
		<div
			className={`card-panel card_${card.id}`}
			style={
				card.picture === undefined
					? {
							backgroundColor: 'var(--field-disabled-color)',
					  }
					: {
							backgroundImage: `url(/api/images/cards/${card.picture})`,
					  }
			}
		>
			<div className="card-button-holder">
				{onAnki === undefined ? null : (
					<button
						disabled={ankiLoading}
						className={`card-button anki ${
							card.anki === undefined ? '' : 'active'
						} ${ankiLoading ? 'loading' : ''}`}
						onClick={() => {
							setAnkiLoading(true);
							onAnki(
								card.id,
								card.anki === undefined
									? AnkiMode.ADD
									: AnkiMode.SYNC,
							).finally(() => setAnkiLoading(false));
						}}
					>
						{card.anki !== undefined || ankiLoading ? '↻' : '★'}
					</button>
				)}
				<button
					className="card-button add"
					onClick={() =>
						goTo(
							createGo('/edit', {
								word: card.word,
							}),
						)
					}
				>
					+
				</button>
				<button
					className="card-button edit"
					onClick={() =>
						goTo(
							createGo('/edit', {
								id: card.id.toString(),
								word: card.word,
								part: card.part,
								definition: card.definition,
								sentence: card.sentence,
								picture: card.picture,
								anki:
									card.anki !== undefined ? 'true' : 'false',
							}),
						)
					}
				>
					E
				</button>
				<button
					className="card-button delete"
					onClick={() => onDelete(card.id)}
				>
					X
				</button>
			</div>
			<div className="card-fields">
				<div className="card-field-row top">
					<p className="card-word">{card.word}</p>
					<p
						className={`card-part ${
							card.part === undefined ? 'no-part' : ''
						}`}
					>
						{parts.find(({ id }) => id === card.part)?.english ??
							''}
					</p>
				</div>
				<div className="card-field-row">
					<p className="card-definition">{`${index + 1}. ${
						card.definition
					}`}</p>
				</div>
				<div className="card-field-row">
					<p className="card-sentence">
						<Highlights sentence={card.sentence} />
					</p>
				</div>
			</div>
		</div>
	);
};

export default CardPanel;
