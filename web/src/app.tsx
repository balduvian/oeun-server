import { ReactNode } from 'react';
import SearchBox from './searchBox';
import { killCtrlZ } from './shared';

type Props = {
	searchValue: string;
	setSearchValue: (searchValue: string) => void;
	goTo: (url: string) => void;
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
