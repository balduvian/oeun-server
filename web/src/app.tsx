import { ReactNode } from 'react';
import { Go } from './go';
import SearchBox from './component/searchBox';
import { ToastHolder } from './toast';
import { Footer } from './component/footer';
import { CollectionSize } from './types';

type Props = {
	searchValue: string;
	collectionSize: CollectionSize | undefined;
	setSearchValue: (searchValue: string) => void;
	goTo: (go: Go) => void;
	children: ReactNode;
};

const App = ({
	searchValue,
	collectionSize,
	setSearchValue,
	goTo,
	children,
}: Props) => {
	return (
		<div id="immr-panel">
			<ToastHolder />
			<SearchBox
				searchValue={searchValue}
				setSearchValue={setSearchValue}
				goTo={goTo}
			/>
			{children}
			<Footer collectionSize={collectionSize} />
		</div>
	);
};

export default App;
