import React from 'react';
import ReactDOM from 'react-dom';
import $ from 'jquery';
import moment from 'moment';
import classnames from 'classnames';
import SearchBar from './SearchBar';
import Avatar from './Avatar';
import ComposeNew from './ComposeNew';
import ComposeEdit from './ComposeEdit';
import ComposeView from './ComposeView';
import SearchResults from './SearchResults';
import Modal from './Modal';
import * as Utils from '../utils/index';
import { sortThreads } from '../utils/threads';
import { openModelWindow, closeModelWindow } from '../utils/dom';
import * as Consts from '../configs/constants';

export default class Inbox extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			...props
		};
		this.timeCheckerIDs = {};
		this.container = null;
		this.debouncer = null;
	}

	componentDidMount() {
		this.container = document.querySelector('#regular-modals');
		const node = ReactDOM.findDOMNode(this);
		const $container = $('.threads', node);
		$container.on('scroll', this.handleScroll.bind(this));

		this.state.threads.forEach(thread => {
			const $thread = $(node).find('.thread[data-thread-id="' + thread.id + '"]');
			const $timestamp = $thread.find('.timestamp');

			this.timeCheckerIDs[thread.id] = setInterval(() => {
				$timestamp.html(Utils.formatTimestamp(thread.lastMessage.timestamp));
			}, 30000);
		});
	}

	componentWillReceiveProps(props) {
		this.state = {
			...props,
			page: this.state.page || 0,
			editMode: this.state.editMode,
			editingThreadID: this.state.editingThreadID,
			showNewThreadModal: this.state.showNewThreadModal
		};

		if ( !props.threads.length && !props.doneFetching  ) {
			this.state.fetching = true;
		}

	}

	setTerm(term) {
		this.setState({ term });
	}

	handleOnSearch() {
		if (this.debouncer) {
			clearTimeout(this.debouncer);
		}

		this.debouncer = setTimeout(() => {
			this.openSearchWindow();
			clearTimeout(this.debouncer);
		}, 500);
	}

	openSearchWindow() {
		if ( !this.state.term ) {
			return false;
		}

		const content = (
			<SearchResults
				term={ this.state.term }
				setTerm={ (term) => this.setTerm(term) }
				rooms={ this.state.rooms }
				user={ this.props.user }
				threads={ this.state.threads }
				contacts={ this.state.contacts }
				closeModelWindow={() => {
					this.closeModelWindow()
				}}
			/>
		);

		openModelWindow({ container: this.container, className: 'search-modal', title: 'Search Results', content });
	}

	handleNewThreadClick(event) {
		this.openComposeWindow();
	}

	handleScroll(event) {
		const { fetching, moreThreads } = this.state;
		const node = ReactDOM.findDOMNode(this);
		const $container = $('.threads', node);

		if ($container[0].scrollTop >= $container[0].scrollHeight - $container[0].clientHeight && !fetching && moreThreads) {
			this.state.fetchNewThreadPage(this.state.page + 1);
			this.setState({ fetching: true, page: this.state.page + 1 });
		}
	}

	handleThreadClick(event) {
		const node = ReactDOM.findDOMNode(this);
		const $thread = $(event.target).closest('.thread');
		const threadID = $thread.attr('data-thread-id');

		// TODO: uncomment when time to reimplement
		// if ($(event.target).is('.glyphicon-remove')) {
		// 	// TODO: add confirmation dialog
		// 	this.props.onRemoveThread(threadID);
		// }
		if ($(event.target).is('.glyphicon-edit, .glyphicon-info-sign')) {
			const room = this.state.rooms.find((room) => room.name === threadID);
			const thread = this.state.threads.find(thread => thread.id === threadID);
			if (room) {
				const currentUserInRoom = room.users.find((user) => user.username === this.state.user.username);

				if (currentUserInRoom.admin) {
					this.openComposeWindowEdit(thread);
				}
				else {
					this.openComposeWindowView(thread, room);
				}
			}
			else {
				this.openComposeWindowEdit(thread);
			}
		}
		else {
			$(node).find('.thread').removeClass('selected');
			$thread.addClass('selected');
			this.props.onThreadChange(threadID);
		}
	}

	closeModelWindow() {
		closeModelWindow({ container: this.container});
	}

	openComposeWindowView(thread, room) {
		const content = <ComposeView thread={thread} room={room} store={this.context.store} />;
		openModelWindow({ container: this.container, className: 'compose-modal', title: 'View Conversation Details', content });
	}

	openComposeWindowEdit(thread) {
		const content = (<ComposeEdit
			store={this.context.store}
			onSave={ () => this.closeModelWindow() }
			rooms={this.state.rooms}
			thread={thread}
			contacts={this.state.contacts}
			onUpdateThread={(threadID, participants, roomNaturalName) => { return this.state.onUpdateThread(threadID, participants, roomNaturalName) }}
		/>);
		openModelWindow({ container: this.container, className: 'compose-modal', title: 'Edit Conversation', content });
	}

	openComposeWindow() {
		const content = (<ComposeNew
			buttonText={'Compose'}
			store={this.context.store}
			onSave={() => this.closeModelWindow() }
			rooms={this.state.rooms}
			contacts={this.state.contacts}
			onNewThread={(participants, roomName) => this.state.onNewThread(participants, roomName)}
			onThreadChange={ this.state.onThreadChange }
		/>);
		openModelWindow({ container: this.container, className: 'compose-modal', title: 'New Conversation', content, props: { styles: { height: '420px' }} });
	}

	render() {
		const { fetching } = this.state;

		const threads = this.state.threads
			.sort(sortThreads)
			.map((thread, index) => {
				const room = this.state.rooms.find((room) => room.name === thread.id);
				let currentUserInRoom = {};
				if ( room ) {
					currentUserInRoom = room.users.find((user) => user.username === this.state.user.username);
				}
				const participants = thread.participants;
				const isGroup = thread.type === Consts.ROOM;
				const name = isGroup
					? thread.naturalName
					: participants[0]
					? participants[0].name
					: '';

				const hasPatient = participants.some(user => user.userType === 'PATIENT');

				let photoUrl;
				if (isGroup) {
					if (hasPatient) {
						photoUrl = '/images/red_group_profile.png';
					}
					else {
						photoUrl = '/images/green_group_profile.png';
					}
				}
				else {
					photoUrl = Utils.getContactAvatarUrl(Utils.hasAvatar(participants[0]));
				}

				const className = classnames({
					'is-group': isGroup,
					'has-patient': hasPatient,
					selected: this.props.currentThreadID !== -1 ? this.props.currentThreadID === thread.id : index === 0
				}, 'thread');

				let text = '';
				if (thread.lastMessage) {
					text = thread.lastMessage.file ? '-- file transfer --' : thread.lastMessage.text;
				}
				let unreadCount = thread.unreadCount ? thread.unreadCount : null;

				return (
					<div
						className={className}
						key={index}
						onClick={e => this.handleThreadClick(e)}
						data-thread-id={thread.id}
						title={participants.map(user => user.name || user.username).join(', ')}>
						<Avatar
							name={name}
							image={photoUrl}
							large={true}
							upperRightCount={unreadCount > 99 ? '+99' : unreadCount} />
						<div className="summary">
							<div className="name">{name}</div>
							<div className="text">{text || '--'}</div>
						</div>
					<span className="timestamp">
						{Utils.formatTimestamp(thread.lastMessage ? thread.lastMessage.timestamp : '', false, true)}
					</span>
						<span className={ `glyphicon  ${isGroup && !currentUserInRoom.admin ? 'glyphicon-info-sign' : 'glyphicon-edit'}` }> </span>
						<span className="glyphicon glyphicon-remove" style={{ display: 'none' }}> </span>
					</div>
				);
			});

		let fetchingBlock;
		if (fetching) {
			fetchingBlock = <div className="fetching">Fetching</div>;
		}

		return (
			<div className="inbox-container">
				<div className="search-container">
					<div className="search-bar">
						<input
							type="text"
							placeholder="Search"
							value={ this.state.term }
							onChange={e => {
								this.setTerm(e.target.value);
								this.handleOnSearch();
							}}
							onKeyDown={e => {
								if (e.keyCode === 13) {
									this.setTerm(e.target.value);
									this.handleOnSearch();
								}
							}}
							ref="searchBox" />
						<span className="glyphicon glyphicon-search" onClick={ () => this.openSearchWindow()}/>
					</div>
					<span
						className="glyphicon glyphicon-edit"
						onClick={e => this.handleNewThreadClick(e)}> </span>
				</div>
				<div className="threads">
					{threads}
					{fetchingBlock}
				</div>
			</div>
		);
	}
}

Inbox.contextTypes = {
	store: React.PropTypes.object
};