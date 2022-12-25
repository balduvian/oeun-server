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
						<p className="footer-info">
							<span>{'모음집 크기 '}</span>
							<span className="collection-size">
								{collectionSize.size}
							</span>
							<span>{'장'}</span>
						</p>
					</div>
					<div>
						<p className="footer-info">
							<span>{'오늘 추가하는 카드 '}</span>
							<span className="added-today">
								{collectionSize.addedToday}
							</span>
							<span>{'장'}</span>
						</p>
					</div>
					<div>
						<p className="footer-info">
							<span>{`오늘 암기에 추가하는 카드 `}</span>
							<span className="anki-today">
								{collectionSize.ankiToday}
							</span>
							<span>{'장'}</span>
						</p>
					</div>
				</>
			)}
		</div>
	);
};
