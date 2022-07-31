import { ReactNode } from 'react';
import { Go } from './go';
import SearchBox from './searchBox';
import { killCtrlZ } from './shared';

type Props = {
	searchValue: string;
	setSearchValue: (searchValue: string) => void;
	goTo: (go: Go) => void;
	children: ReactNode;
};

const App = ({ searchValue, setSearchValue, goTo, children }: Props) => {
	return (
		<div id="immr-panel">
			{killCtrlZ()}
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
