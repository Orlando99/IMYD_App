import React from 'react';
import $ from 'jquery';

import {
	searchMessage,
	searchRelatedMessagesInOneOnOne,
	searchRelatedMessagesInRoom
} from '../services/messages';
import { fetchUsersForRoom } from '../services/rooms';
import * as Consts from '../configs/constants';
import MessageTimestamp from './MessageTimestamp';
import { getStore } from '../utils/store';
import Avatar from './Avatar';
import * as Utils from '../utils/index';
import { indicesOf } from '../utils/string';
import * as messagesAction from '../actions/messages';
import * as threadsAction from '../actions/threads';
import { setSearch } from '../actions/search';

export default class SearchResults extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			...props,
			pagination: {
				page: 0,
				size: 20,
				totalPages: 0,
				totalElements: 0
			},
			foundMessages: [],
			fetching: true,
			debouncer: null
		};
	}

	setTerm(term) {
		this.props.setTerm(term);
		this.setState({ term });
		if ( this.state.foundMessages.length ) {
			this.setState({ foundMessages: [] });
		}
	}

	handleOnSearch(term) {
		if (this.state.debouncer || !term) {
			clearTimeout(this.state.debouncer);
			this.setState({ debouncer: null });
		}

		this.state.debouncer = setTimeout(() => {
			clearTimeout(this.state.debouncer);
			this.setState({ debouncer: null });
			this.search();
		}, 500);
	}

	componentDidMount() {
		this.refs.searchBox.focus();
		this.search();
	}

	highlightText(str) {
		const term = this.state.term;
		if ( !term ) {
			return false;
		}
		const children = [];
		const termSize = term.length;
		const indices = indicesOf({ term, str });
		let start = 0;
		indices.forEach((index) => {
			children.push(str.slice(start, index));
			children.push(<span key={index} className="message-highlight">{ str.slice(index, index + termSize) }</span>);
			start = index + termSize;
		});
		const remaining = str.slice(start, -1);
		if (remaining) {
			children.push(remaining);
		}

		return children;
	};

	search() {
		if (this.state.term) {
			const search = {
				...this.state.pagination,
				term: this.state.term
			};

			this.setState({ fetching: true });
			searchMessage(search).then((resp) => {
				const foundMessages = (resp && resp.status === 200 && resp.data && resp.data.content || []).filter((message) => {
					return !message.file;
				});
				this.setState({ foundMessages, fetching: false });
			}).catch((err) => {
				console.log('error', err);
				console.log(err);
			})
		}
	}

	setSearch({ results, threadID, thread, jumpToMessage, users }) {
		const store = getStore();
		const dispatch = store.dispatch;
		const user = this.props.user;
		const messages = (results && results.status === 200 && results.data && results.data.content || []);

		if(users) {
			messages.forEach((message) => {
				users.forEach((user) => {
					message.users = message.users || {};
					message.users[user.username] = user.name;
				});

				message.isRead = message.delivery && Consts.DISPLAYED in message.delivery &&
					message.delivery[Consts.DISPLAYED].find((item) => {
						return !users.find((user) => {
							return user.username === item.username;
						});
					});
			});
		}

		const jumpToMessageID = jumpToMessage.messageId;
		const searchedMessagesID = messages.map((message) => { return message.messageId });
		const existingMessagesID = thread && thread.messages.map((message) => { return message.messageId }) || [];
		const threadExist = !!thread;

		if (searchedMessagesID.length) {
			dispatch(messagesAction.buildFetchMessagesSuccessAction(threadID, messages, 0, Consts.PAGE_SIZE, false, user, results.data));
			dispatch(setSearch({ jumpToMessageID, searchedMessagesID, existingMessagesID, threadID, threadExist }));
			dispatch(threadsAction.postChangeThread(threadID));
			this.props.closeModelWindow();
		}
		else {
			console.log('error', err);
		}
	}

	jumpToMessage(jumpToMessage) {
		// todo: need to think about a way to handle pagination.

		const containingMessageId = jumpToMessage.messageId;
		const threadID = jumpToMessage.threadName;
		const user = this.props.user;
		const thread = this.props.threads.find((thread) => {
			return thread.name === threadID;
		});

		if(thread) {
			if (jumpToMessage.type === Consts.ROOM) {
				searchRelatedMessagesInRoom({ roomName: threadID, containingMessageId }).then((results) => {
					this.setSearch({ results, threadID, thread, jumpToMessage });
				}).catch((err) => {
					console.log('error', err);
				});
			}
			else {
				const participants = thread.participants;
				const convUsername = participants[0].username;
				searchRelatedMessagesInOneOnOne({ convUsername, containingMessageId }).then((results) => {
					this.setSearch({ results, threadID, thread, jumpToMessage });
				}).catch((err) => {
					console.log('error', err);
				});
			}
		}
		else {
			if (jumpToMessage.type === Consts.ROOM) {
				searchRelatedMessagesInRoom({ roomName: threadID, containingMessageId }).then((results) => {
					fetchUsersForRoom(threadID).then((resultMembers) => {
						let users = (resultMembers && resultMembers.status === 200 && resultMembers.data || []);
						users = users.filter((roomUser) => { return roomUser.username !== user.username; });
						this.setSearch({ results, threadID, jumpToMessage, users });
					}).catch((err) => {
						console.log('error', err);
					});
				}).catch((err) => {
					console.log('error', err);
				});
			}
			else {
			}

			// todo: make this work once we have the api ready
			/*
			 fetchUsersForRoom(threadName).then((result) => {
			 console.log('result', result);
			 }).catch((err) => {
			 console.log('error', err);
			 })
			 */
		}


		/*
		 searchMessage,
		 searchRelatedMessagesInOneOnOne,
		 searchRelatedMessagesInRoom
		 */
	}

	findInContacts(username) {
		return this.props.contacts.find((contact) => {
			return contact.username === username;
		})
	}

	render() {
		const store = getStore();

		let content = null;
		
		if ( this.state.fetching || this.state.debouncer) {
			content = <li className="message-no-results"> Please hold while we perform the search ! </li>;
		}
		else if ( !this.state.term && !this.state.debouncer ) {
			content = <li className="message-no-results"> Please enter a term to search ! </li>;
		}
		else if(!this.state.foundMessages.length && !this.state.fetching) {
			content = <li className="message-no-results">No messages were found </li>;
		}
		else {
			content = this.state.foundMessages.map((message) => {
				const from = this.findInContacts(message.sender.username) || message.sender;
				from.photoUrl = from.photoUrl || true;
				const photoUrl = Utils.getContactAvatarUrl(Utils.hasAvatar(from));
				const name = from.name || from.username;

				return <li key={message.messageId} >
					<div className="message-left">
						<Avatar
							store={ store }
							name={ name }
							image={ photoUrl }
							large={ true } />
					</div>
					<div className="message-right">
						<div className="message-header">
							<span className="message-from-name">{ name }</span>
							<span className="message-timestamp">
								<MessageTimestamp timestamp={message.timestamp}  store={ store }/>
							</span>
							<span
								className="message-jump-to"
								onClick={ ()=> { this.jumpToMessage(message) } }>
								Jump to Message
							</span>
						</div>
						<div className="message-content">{ this.highlightText(message.text) }</div>
					</div>
					<div className="clearfix"></div>
				</li>
			})
		}

		return (
			<div className="container">
				<div className="search-bar">
					<input
						type="text"
						placeholder="Search"
						onChange={e => {
							this.setTerm(e.target.value);
							this.handleOnSearch(e.target.value);
						}}
						value={ this.state.term }
						ref="searchBox" />
					<span className="glyphicon glyphicon-search"
								onClick={e => this.onSearch(e)}/>
				</div>
				<ul className="message-container">
					{ content }
				</ul>
			</div>
		);
	}
}