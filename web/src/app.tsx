import { ReactNode } from 'react';
import SearchBox from './searchBox';
import { killCtrlZ } from './shared';

type Props = {
	searchValue: string;
	setSearchValue: (searchValue: string) => void;
	setWord: (word: string) => void;
	goTo: (url: string) => void;
	children: ReactNode;
};

const App = ({
	searchValue,
	setSearchValue,
	setWord,
	goTo,
	children,
}: Props) => {
	return (
		<div id="immr-panel">
			{killCtrlZ()}
			<SearchBox
				searchValue={searchValue}
				setSearchValue={setSearchValue}
				setWord={setWord}
				goTo={goTo}
			/>
			{children}
		</div>
	);
};

export default App;
