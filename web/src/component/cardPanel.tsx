import React from 'react';
import { Badge, Card, Part, Highlight } from '../types';
import { createGo, Nav } from '../go';
import { warn } from '../toast';
import addIcon from '../icon/add-icon.svg';
import ankiIcon from '../icon/anki-icon.svg';
import deleteIcon from '../icon/delete-icon.svg';
import editIcon from '../icon/edit-icon.svg';
import loadingIcon from '../icon/loading-icon.svg';
import refreshIcon from '../icon/refresh-icon.svg';

type HighlightsProps = {
	highlights: Highlight[] | undefined;
};

const Highlights = React.memo(({ highlights }: HighlightsProps) => {
	return highlights === undefined ? (
		<span />
	) : (
		<>
			{highlights.map(({ string, bold, italic, color }, i) => (
				<span
					key={i}
					style={{
						color: color,
						fontStyle: italic ? 'italic' : undefined,
						fontWeight: bold ? 'bold' : undefined,
					}}
				>
					{string}
				</span>
			))}
		</>
	);
});

const ButtonIcon = React.memo(({ icon }: { icon: string }) => {
	return (
		<div
			className="icon-holder"
			dangerouslySetInnerHTML={{ __html: icon }}
		/>
	);
});

export enum AnkiMode {
	ADD,
	SYNC,
}

const AnkiButton = ({
	card,
	ankiLoading: loading,
	onClick,
}: {
	card: Card;
	ankiLoading: boolean;
	onClick: () => void;
}) => {
	return (
		<button
			disabled={loading}
			className={`card-button anki ${
				card.anki === undefined ? '' : 'active'
			} ${loading ? 'loading' : ''}`}
			onClick={onClick}
		>
			<ButtonIcon
				icon={
					card.anki !== undefined
						? refreshIcon
						: loading
						? loadingIcon
						: ankiIcon
				}
			/>
		</button>
	);
};

type Props = {
	card: Card;
	parts: Part[];
	badges: Badge[];
	index: number;
	onDelete: (id: number) => void;
	onAnki: ((id: number, mode: AnkiMode) => Promise<void>) | undefined;
	nav: Nav;
};

const CardPanel = ({
	card,
	parts,
	badges,
	index,
	onDelete,
	onAnki,
	nav,
}: Props) => {
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
					<AnkiButton
						card={card}
						ankiLoading={ankiLoading}
						onClick={() => {
							setAnkiLoading(true);
							onAnki(
								card.id,
								card.anki === undefined
									? AnkiMode.ADD
									: AnkiMode.SYNC,
							)
								.catch(() => warn('Could not connect to Anki'))
								.finally(() => setAnkiLoading(false));
						}}
					/>
				)}
				<button
					className="card-button add"
					onClick={() =>
						nav.goTo(
							createGo('/edit', {
								word: card.word,
							}),
						)
					}
				>
					<ButtonIcon icon={addIcon} />
				</button>
				<button
					className="card-button edit"
					onClick={() =>
						nav.goTo(
							createGo('/edit', {
								id: card.id.toString(),
								word: card.word,
								part: card.part,
								definition: card.definition,
								sentence: card.sentence,
								picture: card.picture,
								anki:
									card.anki !== undefined ? 'true' : 'false',
								badges: JSON.stringify(card.badges),
							}),
						)
					}
				>
					<ButtonIcon icon={editIcon} />
				</button>
				<button
					className="card-button delete"
					onClick={() => onDelete(card.id)}
				>
					<ButtonIcon icon={deleteIcon} />
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
						{parts.find(({ id }) => id === card.part)?.korean ?? ''}
					</p>
				</div>
				<div className="card-field-row">
					<p className="card-definition">
						{card.definition_highlights === undefined ? (
							<span />
						) : (
							<>
								<span>{`${index + 1}. `}</span>
								<Highlights
									highlights={card.definition_highlights}
								/>
							</>
						)}
					</p>
				</div>
				<div className="card-field-row">
					<p className="card-sentence">
						<Highlights highlights={card.sentence_highlights} />
					</p>
				</div>
				{card.badges.length === 0 ? null : (
					<div className="card-field-row badge-row">
						{card.badges.map(badgeId => {
							const badge = badges.find(
								({ id }) => id === badgeId,
							);
							return (
								<div key={badgeId} className="card-badge">
									<img
										src={
											badge?.picture === undefined
												? '/missing-badge-icon.svg'
												: `/api/images/badges/${badge.picture}`
										}
									/>
									<div className="badge-tooltip">
										{badge?.displayName ??
											`Unknown badge of id: ${badgeId}`}
									</div>
								</div>
							);
						})}
					</div>
				)}
			</div>
		</div>
	);
};

export default CardPanel;
