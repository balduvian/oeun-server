import * as react from 'react';

export type Props<K extends keyof WindowEventMap> = {
	eventName: K;
	callBack: (event: WindowEventMap[K]) => void;
};

export class WindowEvent<K extends keyof WindowEventMap> extends react.Component<Props<K>, {}> {
	constructor(props: Props<K>) {
		super(props);
	}

	componentWillMount() {
		window.addEventListener(this.props.eventName, this.props.callBack);
	}

	componentWillUnmount() {
		window.removeEventListener(this.props.eventName, this.props.callBack);
	}

	render() {
		return null;
	}
}
