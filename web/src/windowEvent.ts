import { memo, useEffect } from 'react';

type Props<K extends keyof WindowEventMap> = {
	eventName: K;
	callback: (event: WindowEventMap[K]) => void;
};

const WindowEvent = <K extends keyof WindowEventMap>({ eventName, callback }: Props<K>) => {
	useEffect(() => {
		window.addEventListener(eventName, callback);
		return () => window.removeEventListener(eventName, callback);
	}, []);

	return null;
};

export default WindowEvent;
