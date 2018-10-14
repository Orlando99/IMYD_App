import React from 'react';
import ReactDOM from 'react-dom';
import $ from 'jquery';
import Users from './Users';
import Groups from './Groups';
import PendingRequests from './PendingRequests';
import { getStore } from '../utils/store';

export default class Contacts extends React.Component {
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

		const $navPane = $container.closest('.users-pane');
		$navPane.find('.tab-pane').addClass('hidden');
		$navPane.find('[data-type="' + $target.data('type') + '"]').removeClass('hidden');
	}

	render() {
		let { pending } = this.state.pendingRequests;
		let pendingTag = null;
		if( pending && pending.length ) {
			pendingTag = <div className="pending-tag pending">{ pending.length }</div>;
		}
		return (
			<div className="users-pane">
				{pendingTag}
				<ul>
					<li
						className="tab-header users-header selected"
						data-type="users"
						onClick={e => this.handleTabClick(e)}>
						Users
					</li>
					<li
						className="tab-header groups-header"
						data-type="groups"
						onClick={e => this.handleTabClick(e)}>
						Groups
					</li>
					<li
						className="tab-header PendingRequests-header"
						data-type="pendingRequests"
						onClick={e => this.handleTabClick(e)}>
						Pending
					</li>
				</ul>
				<div className="tab-pane" data-type="users">
					<Users
						user={this.props.user}
						contacts={this.state.contacts}
						onNewThread={(participants) => {
							this.state.onNewThread(participants);
						}} />
				</div>
				<div className="tab-pane hidden" data-type="groups">
					<Groups
						store={getStore()}
						user={this.props.user}
						contacts={this.state.contacts}
						rooms={this.state.rooms}
						onThreadChange={(id, room) => {
							this.state.onThreadChange(id, room);
						}}
						onNewThread={(participants, roomName) => {
							return this.state.onNewThread(participants, roomName);
						}} />
				</div>
				<div className="tab-pane hidden" data-type="pendingRequests">
					<PendingRequests
						store={getStore()}
						{ ...this.state.pendingRequests }
						user={this.state.user}
						flags={this.state.flags} />
				</div>
			</div>
		);
	}
}