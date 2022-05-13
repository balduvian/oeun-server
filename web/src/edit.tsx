import * as react from 'react';
import * as reactDom from 'react-dom';
import { Card, MessageResponse, Part } from './types';
import * as util from './util';
import { SearchBox } from './searchBox';
import * as shared from './shared';
import { EditPanel } from './editPanel';
import { getParts } from './partsBadges';

type Props = {
	initialWord: string | undefined;
	initialUrl: string | undefined;
};

type State = {
	parts: Part[];
	badges: { [key: string]: string };

	error: boolean;
	cards: Card[];

	collectionSize: number;
};

class EditPage extends react.Component<Props, State> {
	constructor(props: Props) {
		super(props);

		const retrievedParts = getParts();

		this.state = {
			parts: Array.isArray(retrievedParts) ? retrievedParts : [],
			badges: {},

			error: false,
			cards: [],
			collectionSize: 0,
		};

		if (retrievedParts instanceof Promise) {
			retrievedParts.then(parts => this.setState({ parts }));
		}

		if (props.initialUrl !== undefined) {
			util.getRequest<{ cards: Card[] }>(props.initialUrl)
				.then(([code, data]) => {
					if (util.isGood(code, data)) {
						this.setState({ cards: data.cards });
					} else {
						this.setState({ error: true });
					}
				})
				.catch(() => this.setState({ error: true }));
		} else {
			util.getRequest<{ value: number }>('/api/collection/size')
				.then(([code, data]) => {
					if (util.isGood(code, data)) {
						this.setState({ collectionSize: data.value });
					} else {
						this.setState({ error: true });
					}
				})
				.catch(() => this.setState({ error: true }));
		}
	}

	render() {
		return (
			<div id="immr-panel">
				{shared.killCtrlZ()}
				<SearchBox
					searchValue={this.props.initialWord ?? ''}
					onSearch={selection => {
						if (selection === undefined) {
							shared.goToNewPage('/edit', []);
						} else {
							shared.goToNewPage('/edit', [
								['word', selection.word],
								['url', selection.url],
							]);
						}
					}}
				></SearchBox>
				{this.state.cards.length === 0 ? (
					<div className="blank-holder">
						{this.state.error ? (
							<p>Could not find card</p>
						) : (
							<div className="image-holder">
								<div className="size-display">{`${this.state.collectionSize} Cards`}</div>
								<img src="/blank.svg" />
							</div>
						)}
					</div>
				) : (
					this.state.cards.map(card => {
						return (
							<EditPanel
								card={card}
								parts={this.state.parts}
								onDelete={deletedId => {
									util.deleteRequest<MessageResponse>(`/api/collection/${deletedId}`).then(([code, data]) => {
										if (util.isGood(code, data)) {
											this.setState({ cards: this.state.cards.filter(card => card.id !== deletedId) });
										} else {
											console.log(data.error);
										}
									});
								}}
							/>
						);
					})
				)}
			</div>
		);
	}
}

const searchParams = new URLSearchParams(window.location.search);

reactDom.render(<EditPage initialWord={searchParams.get('word') ?? undefined} initialUrl={searchParams.get('url') ?? undefined} />, document.body);
