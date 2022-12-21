import { ReactNode } from 'react';
import { Go } from './go';
import SearchBox from './searchBox';
import { ToastHolder } from './toast';

type Props = {
	searchValue: string;
	setSearchValue: (searchValue: string) => void;
	goTo: (go: Go) => void;
	children: ReactNode;
};

const App = ({ searchValue, setSearchValue, goTo, children }: Props) => {
	return (
		<div id="immr-panel">
			<ToastHolder />
			<SearchBox
				searchValue={searchValue}
				setSearchValue={setSearchValue}
				goTo={goTo}
			/>
			{children}
		</div>
	);
};

export default App;
