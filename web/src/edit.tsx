import * as react from 'react';
import * as reactDom from 'react-dom';
import { Card, MessageResponse, Part } from './types';
import * as util from './util';
import { SearchBox } from './searchBox';
import * as shared from './shared';
import { EditPanel } from './editPanel';

type Props = {
	initialId: number | undefined;
	initialWord: string | undefined;
};

type State = {
	parts: Part[];
	badges: { [key: string]: string };

	error: boolean;
	cards: Card[];
};

class EditPage extends react.Component<Props, State> {
	constructor(props: Props) {
		super(props);

		this.state = {
			parts: [],
			badges: {},

			error: false,
			cards: [],
		};

		shared.getPartsBadges().then(({ parts, badges }) => this.setState({ parts, badges }));

		if (props.initialId !== undefined) {
			util.getRequest<{ cards: Card[] }>(`/api/collection/homonym/${props.initialId}`)
				.then(([code, data]) => {
					if (util.isGood(code, data)) {
						this.setState({ cards: data.cards });
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
					onSearch={({ word, id }) =>
						shared.goToNewPage('/edit', [
							['id', id.toString()],
							['word', word],
						])
					}
				></SearchBox>
				{this.state.cards.length === 0 ? (
					<div className="blank-holder">{this.state.error ? <p>Could not find card</p> : <img src="/blank.svg" />}</div>
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
const initialId = searchParams.get('id');

reactDom.render(<EditPage initialId={initialId === null ? undefined : +initialId} initialWord={searchParams.get('word') ?? undefined} />, document.body);
