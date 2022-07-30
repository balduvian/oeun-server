import React, * as react from 'react';
import { Card, Part } from './types';
import * as util from './util';
import { EbetPictureInput } from './ebetUi';

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

type Props = {
	card: Card;
	parts: Part[];
	onDelete: (id: number) => void;
	goTo: (url: string) => void;
};

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

const CardPanel = ({ card, parts, onDelete, goTo }: Props) => {
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
							`/edit?${util.makeQueryString({
								id: card.id.toString(),
								word: card.word,
								part: card.part,
								definition: card.definition,
								sentence: card.sentence,
								picture: card.picture,
							})}`,
						)
					}
				>
					E
				</button>
				<button
					className="card-button add"
					onClick={() =>
						goTo(
							`/edit?${util.makeQueryString({
								word: card.word,
							})}`,
						)
					}
				>
					+
				</button>
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
				src={`/api/images/cards/${card.picture}`}
				disabled
			/>
		</div>
	);
};

export default CardPanel;
