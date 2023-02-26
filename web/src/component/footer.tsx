import { CollectionSize } from '../types';

type Props = {
	collectionSize: CollectionSize | undefined;
};

export const Footer = ({ collectionSize }: Props) => {
	return (
		<div className="footer">
			{collectionSize === undefined ? null : (
				<>
					<div>
						<p className="footer-info collection-size">
							<span>{'전체 '}</span>
							<span className="bold">{collectionSize.size}</span>
						</p>
					</div>
					<div>
						<p className="footer-info edited-today">
							<span>{'수정 '}</span>
							<span className="bold">
								{collectionSize.editedToday}
							</span>
						</p>
					</div>
					<div>
						<p className="footer-info added-today">
							<span>{'추가 '}</span>
							<span className="bold">
								{collectionSize.addedToday}
							</span>
						</p>
					</div>
					<div>
						<p className="footer-info anki-today">
							<span>{`암기 `}</span>
							<span className="bold">
								{collectionSize.ankiToday}
							</span>
						</p>
					</div>
				</>
			)}
		</div>
	);
};
