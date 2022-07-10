import { ReactNode } from 'react';
import SearchBox from './searchBox';
import { killCtrlZ } from './shared';

type Props = {
	searchValue: string;
	setSearchValue: (searchValue: string) => void;
	setWord: (word: string) => void;
	setRoute: (route: string) => void;
	children: ReactNode;
};

const App = ({
	searchValue,
	setSearchValue,
	setWord,
	setRoute,
	children,
}: Props) => {
	return (
		<div id="immr-panel">
			{killCtrlZ()}
			<SearchBox
				searchValue={searchValue}
				setSearchValue={setSearchValue}
				setWord={setWord}
				setRoute={setRoute}
			/>
			{children}
		</div>
	);
};

export default App;
