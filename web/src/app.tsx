import { Outlet } from 'react-router-dom';
import SearchBox from './searchBox';
import { killCtrlZ } from './shared';

type Props = {
	searchValue: string;
	setSearchValue: (searchValue: string) => void;
	setWord: (word: string) => void;
};

const App = ({ searchValue, setSearchValue, setWord }: Props) => {
	return (
		<div id="immr-panel">
			{killCtrlZ()}
			<SearchBox
				searchValue={searchValue}
				setSearchValue={setSearchValue}
				setWord={setWord}
			/>
			<Outlet />
		</div>
	);
};

export default App;
