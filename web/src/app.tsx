import { ReactNode } from 'react';
import { Go } from './go';
import Header from './component/header';
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
		<div className="app-container">
			<ToastHolder />
			<Header
				searchValue={searchValue}
				setSearchValue={setSearchValue}
				goTo={goTo}
			/>
			<div className="page-content">{children}</div>
			<Footer collectionSize={collectionSize} />
		</div>
	);
};

export default App;
