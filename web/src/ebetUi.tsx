import { text } from 'stream/consumers';

export type Size = 'small' | 'medium' | 'large';

/* ELEMENTS */

type InputProps = {
	size?: Size;
	disabled?: boolean;
	error?: boolean;
	fullWidth?: boolean;
	value: string;
	events: JSX.IntrinsicElements['input'];
};

export const EbetInput = ({
	size = 'medium',
	disabled = false,
	error = false,
	fullWidth = true,
	events,
	value,
}: InputProps) => {
	return (
		<input
			className={`${size} ${fullWidth ? 'full-width' : ''} ${
				error ? 'error' : ''
			} eui-input`}
			value={value}
			disabled={disabled}
			{...events}
		/>
	);
};

type ButtonProps = {
	size?: Size;
	disabled?: boolean;
	fullWidth?: boolean;
	positive?: boolean;
	text: string;
	onClick: () => void;
	events?: JSX.IntrinsicElements['button'];
};

export const EbetButton = ({
	size,
	disabled,
	fullWidth = true,
	positive = false,
	text,
	onClick,
	events = {},
}: ButtonProps) => {
	return (
		<button
			className={`${size ?? 'small'}  ${fullWidth ? 'full-width' : ''} ${
				positive ? 'positive' : ''
			} eui-button`}
			onClick={onClick}
			disabled={disabled ?? false}
			{...events}
		>
			{text}
		</button>
	);
};

type LabelProps = {
	size?: Size;
	text: string;
};

export const EbetLabel = ({ size, text }: LabelProps) => {
	return <p className={`${size ?? 'small'} eui-label`}>{text}</p>;
};

type FormFieldProps = {
	children: React.ReactNode;
};

export const EbetFormField = ({ children }: FormFieldProps) => {
	return <div className="eui-field">{children}</div>;
};

type SelectProps = {
	size?: Size;
	disabled?: boolean;
	fullWidth?: boolean;
	options: { value: string; text: string }[];
	onChange: (value: string) => void;
	value: string;
};

export const EbetSelect = ({
	size = 'medium',
	disabled = false,
	fullWidth = true,
	options,
	onChange,
	value,
}: SelectProps) => (
	<select
		className={`${size} ${fullWidth ? 'full-width' : ''} eui-select`}
		value={value}
		onChange={event => onChange(event.currentTarget.value)}
		disabled={disabled}
	>
		{options.map(({ value, text }) => (
			<option key={value} value={value}>
				{text}
			</option>
		))}
	</select>
);

type PictureInputProps = {
	src: string | undefined;
	fullWidth?: boolean;
	disabled?: boolean;
	onDelete?: () => void;
	onPaste?: (buffer: ArrayBuffer) => void;
	events?: JSX.IntrinsicElements['input'];
};

export const EbetPictureInput = ({
	src,
	fullWidth = true,
	disabled = false,
	onDelete,
	onPaste,
	events = {},
}: PictureInputProps) => {
	return (
		<div
			className={`${fullWidth ? 'full-width' : ''} eui-picture-container`}
		>
			{disabled ? null : (
				<input
					readOnly
					{...events}
					onKeyDown={event => {
						if (event.code === 'Delete') {
							event.preventDefault();
							onDelete?.();
						} else if (event.code === 'Escape') {
							event.preventDefault();
							event.currentTarget.blur();
						}
					}}
					onPaste={event => {
						event.preventDefault();

						const file =
							[...event.clipboardData.items]
								.find(
									item =>
										item.type === 'image/png' ||
										item.type === 'image/jpeg',
								)
								?.getAsFile() ?? undefined;
						if (file === undefined) return;

						file.arrayBuffer()
							.then(buffer => onPaste?.(buffer))
							.catch(console.error);
					}}
				/>
			)}
			{src !== undefined ? (
				<img className="card-img" src={src} />
			) : (
				<div className="eui-picture-placeholder">
					<span>{disabled ? '%' : 'Paste Image Here'}</span>
				</div>
			)}
		</div>
	);
};
