import React from 'react';
import ReactDOM from 'react-dom';
import $ from 'jquery';
import Inbox from './Inbox';
import Contacts from './Contacts';
import { getStore } from '../utils/store';
import * as pendingRequestsMetaAction from '../actions/pendingRequestsMeta';

export default class NavigationPane extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			...props
		}
	}

	componentWillReceiveProps(props) {
		this.state = {
			...props
		};
	}

	handleTabClick(event) {

		const $target = $(event.target).closest('li');
		const $container = $target.closest('ul');
		$container.find('li').removeClass('selected');
		$target.addClass('selected');

		const $navPane = $container.closest('.navigation-pane');
		$navPane.find('.nav-tab-pane').addClass('hidden');
		$navPane.find('[data-type="' + $target.data('type') + '"]').removeClass('hidden');
		const { dispatch } = getStore();
		dispatch(pendingRequestsMetaAction.removeTempThread());
	}

	selectInbox() {
		const $node = $(ReactDOM.findDOMNode(this));
		$node.find('li.inbox-header, li.users-header').removeClass('selected');
		$node.find('li[data-type="inbox"]').addClass('selected');
		$node.find('.nav-tab-pane').addClass('hidden');
		$node.find('[data-type="inbox"]').removeClass('hidden');
	}

	render() {
		let { pending } = this.state.pendingRequests;
		let pendingTag = null;
		if( pending && pending.length ) {
			pendingTag = <div className="pending-tag contact">{ pending.length }</div>;
		}
		return (
			<div className="navigation-pane">
				{pendingTag}
				<ul>
					<li
						className="tab-header inbox-header selected"
						data-type="inbox"
						onClick={e => this.handleTabClick(e)}>
						<span className="glyphicon glyphicon-envelope"> </span>
						Inbox
					</li>
					<li
						className="tab-header contacts-header"
						data-type="contacts"
						onClick={e => this.handleTabClick(e)}>
						<span className="glyphicon glyphicon-th-list"> </span>
						Contacts
					</li>
				</ul>
				<div className="nav-tab-pane" data-type="inbox">
					<Inbox
						user={this.state.user}
						rooms={this.state.rooms}
						threads={this.state.threads}
						onThreadChange={this.state.onThreadChange}
						onRemoveThread={this.state.onRemoveThread}
						onNewThread={this.state.onNewThread}
						onUpdateThread={this.state.onUpdateThread}
						contacts={this.state.contacts}
						currentThreadID={this.state.currentThreadID}
						fetchNewThreadPage={(page) => this.state.fetchNewThreadPage(page)}
						moreThreads={this.state.moreThreads}
						doneFetching={this.state.doneFetching}/>
				</div>
				<div className="nav-tab-pane hidden" data-type="contacts">
					<Contacts
						user={this.props.user}
						contacts={this.state.contacts}
						pendingRequests={this.state.pendingRequests}
						rooms={this.state.rooms}
						onNewThread={(participants, roomName) => {
							this.selectInbox();
							return this.state.onNewThread(participants, roomName);
						}}
						onThreadChange={(id, room) => {
							this.state.onThreadChange(id, room);
							this.selectInbox();
						}} />
				</div>
			</div>
		);
	}
}
