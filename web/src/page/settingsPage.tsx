import React from 'react';
import {
	EbetButton,
	EbetFormField,
	EbetInput,
	EbetLabel,
	InputProps,
} from '../ebetUi';
import { Settings } from '../settings';
import { Setter, WholeCollectionSyncReturn } from '../types';
import { postRequest } from '../util';
import { nice, warn } from '../toast';

type SettingsInputProps = {
	label: string;
	value: string;
	onChange: (value: string) => void;
	inputProps?: Partial<InputProps>;
};

const SettingsInput = ({
	label,
	value,
	onChange,
	inputProps = {},
}: SettingsInputProps) => (
	<EbetFormField>
		<EbetLabel text={label} />
		<EbetInput
			value={value}
			events={{
				onChange: event => onChange(event.target.value),
			}}
			{...inputProps}
		/>
	</EbetFormField>
);

type Props = {
	settings: Settings;
	setSettings: Setter<Partial<Settings>>;
};

type DummySettings = { [k in keyof Settings]: string };

const createDummySettings = (real: Settings): DummySettings => {
	return Object.assign(
		{},
		...Object.entries(real).map(([key, value]) => ({
			[key]: value?.toString() ?? '',
		})),
	);
};

export const stringToReal = (input: string): string | null => {
	const trimmed = input.trim();
	return trimmed.length === 0 ? null : trimmed;
};

export const intToReal = (input: string): number | null => {
	const trimmed = input.trim();

	for (let i = 0; i < trimmed.length; ++i) {
		const code = trimmed.charCodeAt(i);
		if (i === 0 && code === 45) continue;
		if (code < 48 || code > 57) return null;
	}

	return Number.parseInt(trimmed);
};

export const blankToNull = (input: string) =>
	input.length === 0 ? null : input;

export const SettingsPage = ({ settings, setSettings }: Props) => {
	const [waiting, setWaiting] = React.useState(false);
	const [dummySettings, setDummySettings] = React.useState<DummySettings>(
		() => createDummySettings(settings),
	);

	const changeSetting = (
		setting: keyof Settings,
		dummyValue: string,
		converter: (input: string) => string | number | null,
	) => {
		setDummySettings({ ...dummySettings, [setting]: dummyValue });
		setSettings({ [setting]: converter(dummyValue) });
	};

	return (
		<div className="standard-sheet">
			<h2>Anki Connect Settings</h2>
			<SettingsInput
				label="Deck Name"
				value={dummySettings.deckName}
				onChange={value =>
					changeSetting('deckName', value, stringToReal)
				}
			/>
			<SettingsInput
				label="Model Name"
				value={dummySettings.modelName}
				onChange={value =>
					changeSetting('modelName', value, stringToReal)
				}
			/>
			<EbetButton
				text={waiting ? '...' : 'Sync Whole Collection'}
				disabled={waiting}
				onClick={
					waiting
						? undefined
						: () => {
								setWaiting(true);

								postRequest<WholeCollectionSyncReturn>(
									'/api/anki/sync',
									{},
								)
									.then(({ editCount, warnings }) => {
										warnings.forEach(warn);
										nice(`Synced ${editCount} cards`);
									})
									.finally(() => {
										setWaiting(false);
									});
						  }
				}
			/>
			<h2>Ebetshot Settings</h2>
			<SettingsInput
				label="Extension ID"
				value={dummySettings.extensionId}
				onChange={value =>
					changeSetting('extensionId', value, stringToReal)
				}
			/>
			<h2>General</h2>
			<SettingsInput
				label="Day Cutoff Hour"
				value={dummySettings.dayCutoffHour}
				onChange={value =>
					changeSetting('dayCutoffHour', value, intToReal)
				}
				inputProps={{
					error:
						dummySettings.dayCutoffHour.length > 0 &&
						settings.dayCutoffHour === null,
				}}
			/>
		</div>
	);
};
export default SettingsPage;
