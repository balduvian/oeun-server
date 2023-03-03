import React from 'react';
import { Badge, Setter } from '../types';
import addIcon from '../icon/add-icon.svg';
import {
	EbetFormField,
	EbetInput,
	EbetLabel,
	EbetPictureInput,
	EbetButton,
} from '../ebetUi';
import {
	bufferToBase64,
	deleteRequest,
	pngDataURL,
	putRequest,
	stripPictureURL,
} from '../util';
import { warn } from '../toast';

type EditingBadge = {
	oldId: string | undefined;
	id: string;
	displayName: string;
	picture: string;
};

const deselectedState = () => ({
	selectedId: undefined,
	editingBadge: undefined,
});
const blankEditingBadge = (): EditingBadge => ({
	oldId: undefined,
	id: '',
	displayName: '',
	picture: '',
});

const validateId = (
	id: string,
	badges: Badge[],
	ignoreId: string | undefined,
): string | undefined => {
	const trimmed = id.trim();
	if (trimmed.length === 0) return undefined;

	for (let i = 0; i < trimmed.length; ++i) {
		const code = trimmed.charCodeAt(i);
		if ((code < 65 || code > 90) && code !== 95) return undefined;
	}

	if (
		badges.some(
			({ id: otherId }) => otherId !== ignoreId && otherId === trimmed,
		)
	)
		return undefined;

	return trimmed;
};

const validateName = (name: string) => {
	const trimmed = name.trim();
	if (trimmed.length === 0) return undefined;

	return trimmed;
};

const BASE_PICTURE_URL = '/api/images/badges/';

const writeBadgeIntoList = (
	badges: Badge[],
	newBadge: Badge,
	oldId: string | undefined,
): Badge[] => {
	if (oldId === undefined) return [...badges, newBadge];

	const index = badges.findIndex(({ id }) => id === oldId);
	const newList = [...badges];
	newList[index] = newBadge;

	return newList;
};

const removeBadgeFromList = (badges: Badge[], id: string): Badge[] => {
	return badges.filter(({ id: existingId }) => existingId !== id);
};

const BadgeEditor = ({
	editingBadge: { oldId, id, displayName, picture },
	setField,
	badges,
	save,
	onDelete,
	cancel,
}: {
	editingBadge: EditingBadge;
	setField: (fieldName: keyof EditingBadge, value: string) => void;
	badges: Badge[];
	save: (oldId: string | undefined, badge: Badge) => void;
	onDelete: (id: string) => void;
	cancel: () => void;
}) => {
	const validId = validateId(id, badges, oldId);
	const validDisplayName = validateName(displayName);
	const validPicture = stripPictureURL(picture, BASE_PICTURE_URL);

	const isGood =
		validId !== undefined &&
		validDisplayName !== undefined &&
		validPicture !== undefined;

	return (
		<div
			className="badge-editor-panel"
			onClick={event => event.stopPropagation()}
		>
			<EbetFormField>
				<EbetLabel text="id" />
				<EbetInput
					value={id}
					events={{
						onChange: event =>
							setField('id', event.currentTarget.value),
					}}
					error={validId === undefined}
				/>
			</EbetFormField>
			<EbetFormField>
				<EbetLabel text="Display Name" />
				<EbetInput
					value={displayName}
					events={{
						onChange: event =>
							setField('displayName', event.currentTarget.value),
					}}
					error={validDisplayName === undefined}
				/>
			</EbetFormField>
			<EbetFormField>
				<EbetLabel text="Picture" />
				<EbetPictureInput
					paste={false}
					src={picture.length === 0 ? undefined : picture}
					onBuffer={buffer =>
						setField('picture', pngDataURL(bufferToBase64(buffer)))
					}
					onDelete={() => setField('picture', '')}
					aspectRatio={1.0}
				/>
			</EbetFormField>
			<div className="button-grid">
				<EbetButton text="Cancel" onClick={cancel} />
				{oldId === undefined ? undefined : (
					<EbetButton text="Delete" onClick={() => onDelete(oldId)} />
				)}
				<EbetButton
					text={oldId === undefined ? 'Create' : 'Save'}
					onClick={
						!isGood
							? undefined
							: () =>
									save(oldId, {
										id: validId,
										displayName: validDisplayName,
										picture: validPicture,
									})
					}
					disabled={!isGood}
					positive={isGood}
				/>
			</div>
		</div>
	);
};

const BadgeDisplay = ({
	selected,
	onClick,
	pictureComponent: imageComponent,
	displayName: name,
}: {
	selected: boolean;
	onClick: () => void;
	pictureComponent: JSX.Element;
	displayName: string;
}) => {
	return (
		<div
			className={`badge-display ${selected ? 'selected' : ''}`}
			onClick={event => {
				event.stopPropagation();
				onClick();
			}}
		>
			<div className="card-badge">{imageComponent}</div>
			<p className="badge-name">{name}</p>
		</div>
	);
};

type State = {
	selectedId: string | undefined;
	editingBadge: EditingBadge | undefined;
};

type Props = {
	badges: Badge[];
	setBadges: Setter<Badge[]>;
};

const BadgesPage = ({ badges, setBadges }: Props) => {
	const [{ selectedId, editingBadge }, setState] = React.useState<State>({
		selectedId: undefined,
		editingBadge: undefined,
	});

	return (
		<div
			className="standard-sheet"
			onClick={() => setState(deselectedState())}
		>
			<h2>Badges</h2>
			<div className="badge-grid">
				{[
					...badges.map(({ id, displayName, picture }) => (
						<BadgeDisplay
							key={id}
							displayName={displayName}
							pictureComponent={
								<img src={`${BASE_PICTURE_URL}${picture}`} />
							}
							selected={selectedId === id}
							onClick={() => {
								setState({
									editingBadge: {
										oldId: id,
										id,
										displayName,
										picture: `${BASE_PICTURE_URL}${picture}`,
									},
									selectedId: id,
								});
							}}
						/>
					)),
					<BadgeDisplay
						key={'new'}
						displayName={'New'}
						pictureComponent={
							<div
								dangerouslySetInnerHTML={{ __html: addIcon }}
							/>
						}
						selected={selectedId === 'new'}
						onClick={() => {
							setState({
								editingBadge: blankEditingBadge(),
								selectedId: 'new',
							});
						}}
					/>,
				]}
			</div>
			{editingBadge === undefined ? null : (
				<div
					className="click-out-cover"
					onClick={() => setState(deselectedState())}
				>
					<BadgeEditor
						badges={badges}
						cancel={() => setState(deselectedState())}
						editingBadge={editingBadge}
						setField={(field, value) => {
							setState(state => {
								const editingBadge = state.editingBadge;
								if (editingBadge === undefined) return state;

								return {
									...state,
									editingBadge: {
										...editingBadge,
										[field]: value,
									},
								};
							});
						}}
						onDelete={id => {
							deleteRequest(`/api/badges/${id}`)
								.then(() => {
									setState(deselectedState());
									setBadges(removeBadgeFromList(badges, id));
								})
								.catch(() => warn('Could not delete badge'));
						}}
						save={(oldId, uploadBadge) =>
							putRequest<Badge>(
								`/api/badges/${
									oldId === undefined ? '' : oldId
								}`,
								uploadBadge,
							)
								.then(newBadge => {
									setState(deselectedState());
									setBadges(
										writeBadgeIntoList(
											badges,
											newBadge,
											editingBadge.oldId,
										),
									);
								})
								.catch(() => warn('Could not upload badge'))
						}
					/>
				</div>
			)}
		</div>
	);
};
export default BadgesPage;
