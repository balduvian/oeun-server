import { EbetFormField, EbetInput, EbetLabel } from './ebetUi';
import { Settings } from './settings';
import { Setter } from './types';

type SettingsInputProps = {
	label: string;
	value: string;
	onChange: (value: string) => void;
};

const SettingsInput = ({ label, value, onChange }: SettingsInputProps) => (
	<EbetFormField>
		<EbetLabel text={label} />
		<EbetInput
			value={value}
			events={{
				onChange: event => onChange(event.target.value),
			}}
		/>
	</EbetFormField>
);

type Props = {
	settings: Settings;
	setSettings: Setter<Partial<Settings>>;
};

export const blankToNull = (input: string) =>
	input.length === 0 ? null : input;

export const SettingsPage = ({ settings, setSettings }: Props) => {
	return (
		<div id="immr-card-panel">
			<h2>Anki Connect Settings</h2>
			<SettingsInput
				label="Deck Name"
				value={settings.deckName ?? ''}
				onChange={value =>
					setSettings({ deckName: blankToNull(value) })
				}
			/>
			<SettingsInput
				label="Model Name"
				value={settings.modelName ?? ''}
				onChange={value =>
					setSettings({ modelName: blankToNull(value) })
				}
			/>
			<h2>Ebetshot Settings</h2>
			<SettingsInput
				label="Extension ID"
				value={settings.extensionId ?? ''}
				onChange={value =>
					setSettings({ extensionId: blankToNull(value) })
				}
			/>
		</div>
	);
};
export default SettingsPage;
