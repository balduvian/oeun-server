import { Outlet } from 'react-router-dom';
import SearchBox from './searchBox';
import { killCtrlZ } from './shared';

type Props = {
	searchValue: string;
	setSearchValue: (searchValue: string) => void;
};

const App = ({ searchValue, setSearchValue }: Props) => {
	return (
		<div id="immr-panel">
			{killCtrlZ()}
			<SearchBox
				searchValue={searchValue}
				setSearchValue={setSearchValue}
			/>
			<Outlet />
		</div>
	);
};

export default App;
