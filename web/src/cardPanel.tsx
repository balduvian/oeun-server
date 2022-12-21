import React, * as react from 'react';
import { Card, Part } from './types';
import * as util from './util';
import { EbetPictureInput } from './ebetUi';
import { createGo, Go } from './go';

type CardFieldProps = {
	className: string;
	style: react.CSSProperties;
	displayValue: React.ReactNode;
};

const CardField = react.memo(
	({ className, style, displayValue }: CardFieldProps) => (
		<p className={`immr-card-edit ${className}`} style={style}>
			{displayValue}
		</p>
	),
);

type PartFieldProps = {
	part: string | undefined;
	parts: Part[];
};

const PartField = react.memo(({ part, parts }: PartFieldProps) => (
	<p className={`immr-part-edit ${part === undefined ? 'no-part' : ''}`}>
		{parts.find(({ id }) => id === part)?.english ?? ''}
	</p>
));

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
	onDelete: (id: number) => void;
	onAnki: ((id: number, mode: AnkiMode) => Promise<void>) | undefined;
	goTo: (go: Go) => void;
};

const CardPanel = ({ card, parts, onDelete, onAnki, goTo }: Props) => {
	const [ankiLoading, setAnkiLoading] = React.useState(false);

	return (
		<div id="immr-card-panel">
			<div className="immr-card-row">
				<CardField
					className="big"
					style={{ fontWeight: 'bold' }}
					displayValue={card.word}
				/>
				<PartField part={card.part} parts={parts} />
				<button
					className="card-button delete"
					onClick={() => onDelete(card.id)}
				>
					X
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
			</div>
			<div className="immr-card-row">
				<CardField
					className="small"
					style={{}}
					displayValue={card.definition}
				/>
			</div>
			<div className="immr-card-row">
				<CardField
					className="immr-card-sentence"
					style={{ textAlign: 'center' }}
					displayValue={<Highlights sentence={card.sentence} />}
				/>
			</div>
			<EbetPictureInput
				src={
					card.picture === undefined
						? undefined
						: `/api/images/cards/${card.picture}`
				}
				disabled
			/>
		</div>
	);
};

export default CardPanel;
