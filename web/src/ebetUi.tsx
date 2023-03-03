export type Size = 'small' | 'medium' | 'large';

/* ELEMENTS */

export type InputProps = {
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
	onClick: (() => void) | undefined;
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
	onBuffer: (buffer: ArrayBuffer) => void;
	aspectRatio: number;
	events?: JSX.IntrinsicElements['input'];
	paste: boolean;
};

export const EbetPictureInput = ({
	src,
	fullWidth = true,
	disabled = false,
	onDelete,
	onBuffer,
	aspectRatio,
	events = {},
	paste,
}: PictureInputProps) => {
	return (
		<div
			className={`${fullWidth ? 'full-width' : ''} eui-picture-container`}
		>
			{disabled ? null : (
				<input
					accept=".jpg,.jpeg,.png,.webp"
					type={paste ? undefined : 'file'}
					readOnly={paste}
					{...events}
					onKeyDown={event => {
						if (
							event.code === 'Delete' ||
							event.code === 'Backspace'
						) {
							event.preventDefault();
							onDelete?.();
						} else if (event.code === 'Escape') {
							event.preventDefault();
							event.currentTarget.blur();
						}
						events.onKeyDown?.(event);
					}}
					onPaste={
						!paste
							? undefined
							: event => {
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
										.then(buffer => onBuffer(buffer))
										.catch(console.error);
							  }
					}
					onChange={
						paste
							? undefined
							: event => {
									const file = event.currentTarget.files?.[0];
									if (file === undefined) return;

									console.log(file.name);
									console.log(file.type);

									const fileReader = new FileReader();
									fileReader.readAsArrayBuffer(file);
									fileReader.onload = event => {
										const buffer = event.target?.result;
										if (
											buffer === null ||
											buffer === undefined
										)
											return;

										onBuffer(buffer as ArrayBuffer);
									};
							  }
					}
				/>
			)}
			{src !== undefined ? (
				<img className="card-img" src={src} />
			) : (
				<div
					className="eui-picture-placeholder"
					style={{ paddingTop: `calc(${aspectRatio} * 100%)` }}
				>
					<span>
						{disabled
							? '%'
							: paste
							? 'Paste Image Here'
							: 'Upload Image'}
					</span>
				</div>
			)}
		</div>
	);
};
