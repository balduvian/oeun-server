import toast, { Toaster } from 'react-hot-toast';

export const ToastHolder = () => {
	return (
		<Toaster
			position="top-center"
			reverseOrder={false}
			gutter={8}
			containerClassName=""
			containerStyle={{}}
			toastOptions={{
				duration: 5000,
			}}
		/>
	);
};

export const warn = (warning: string) => {
	toast(warning, {
		icon: '⚠️',
		style: { backgroundColor: 'var(--red)', color: 'var(--text)' },
	});
};

export const nice = (message: string) => {
	toast(message, {
		icon: '✅',
		style: { backgroundColor: 'var(--blu)', color: 'var(--text)' },
	});
};
