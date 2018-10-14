import React from 'react';
import ReactDOM from 'react-dom';
import $ from 'jquery';
import Users from './Users';
import Groups from './Groups';
import { getStore } from '../utils/store';

export default class ForwardMessageContacts extends React.Component {

	constructor(props) {
		super(props);
		this.handleTabClick = this.handleTabClick.bind(this);
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
		const { user, contacts, rooms, onThreadChange, onNewThread } = this.props;
		return (
			<div className="users-pane forward-message">
				<ul>
					<li
						className="tab-header users-header selected"
						data-type="users"
						onClick={this.handleTabClick}>
						Users
					</li>
					<li
						className="tab-header groups-header"
						data-type="groups"
						onClick={this.handleTabClick}>
						Groups
					</li>
				</ul>
				<div className="tab-pane" data-type="users">
					<Users
						contacts={contacts}
						onNewThread={onNewThread} />
				</div>
				<div className="tab-pane hidden" data-type="groups">
					<Groups
						store={getStore()}
						user={user}
						contacts={contacts}
						rooms={rooms}
						onThreadChange={onThreadChange}
						onNewThread={onNewThread} />
				</div>
			</div>
		);
	}
}