import _ from 'lodash';
import update from 'immutability-helper';

import * as Consts from '../configs/constants';
import * as notifications from '../lib/notifications';
import { sortMessages } from '../utils/messages';
import * as outgoing from '../lib/webSocket/outgoing';
import * as UnreadCounter from '../lib/UnreadCounter';

// unfortunate workaround for https://phabricator.babeljs.io/T6777
typeof undefined;

export default function threads(state = [], action) {
	switch (action.type) {
		case Consts.FETCH_THREADS_SUCCESS: {
			const existingIds = [];
			let filteredThreads = [...state];
			action.threads.forEach(thread => {
				thread.messages = thread.messages || [];
				thread.lastMessage = thread.lastMessage || {};
				thread.id = thread.id || thread.name;
				thread.page = 0;
				thread.pageSize = Consts.PAGE_SIZE;
				thread.unreadCount = thread.unreadCount || 0;
				thread.participants = thread.participants || thread.users || [];
				thread.inputBuffer = '';

				var index = filteredThreads.findIndex((existingThread) => {
					return existingThread.id == thread.id;
				});
				if (index > -1) {
					filteredThreads.splice(index, 1);
				}
			});
			return filteredThreads.concat(action.threads);
		}

		case Consts.FETCH_MESSAGES: {
			const threadIndex = state.findIndex((thread) => thread.id === action.threadID);

			return threadIndex > -1 ? update(state, { [threadIndex]: { $merge: { fetching: true } } })
				: state;
		}

		case Consts.FETCH_MESSAGES_FAILURE: {
			const threadIndex = state.findIndex((thread) => thread.id === action.threadID);

			return threadIndex > -1 ? update(state, { [threadIndex]: {
				$unset: ['needsMessageFetch'],
				$merge: { fetchedInitialMessages: true, fetching: false },
			} }) : state;
		}

		case Consts.FETCH_MESSAGES_SUCCESS: {
			const threadIndex = state.findIndex((thread) => thread.id === action.threadID);

			if (threadIndex > -1) {
				const found = state[threadIndex];
				let filteredMessages = [...found.messages];
				const existingIds = [];
				action.messages.forEach(message => {
					message.threadID = action.threadID;
					message.isRead = !!message.delivery && Consts.DISPLAYED in message.delivery &&
						!!message.delivery[Consts.DISPLAYED].find((item) => {
							return !found.participants.find((user) => {
								return user.username === item.username;
							});
						});

					// on first fetch we check for delivered message and setDeliveryStatus
					if (!message.currentUser && message.delivery) {
						message.delivery[Consts.DELIVERED] = message.delivery[Consts.DELIVERED] || [];
						let setDeliveredStatus  = message.delivery[Consts.DELIVERED].findIndex((item) => {
								return action.user.username == item.username;
							}) <= -1;

						if (setDeliveredStatus) {
							const messageId = message.messageId;
							outgoing.setDeliveredStatus({ messageId, toUsername: message.sender.username, messageUid: messageId });
						}
					}

					message.users = message.users || {};
					if (found.participants) {
						found.participants.forEach((user) => {
							message.users[user.username] = user.name;
						});
					}

					var index = filteredMessages.findIndex((existingMessage) => {
						return existingMessage.messageId == message.messageId;
					});
					if (index > -1) {
						filteredMessages.splice(index, 1);
					}
				});

				let newMessages = action.messages.concat(filteredMessages);
				newMessages.sort(sortMessages);

				// found.unreadCount = found.messages.reduce((count, message) => {
				// 	if (!message.currentUser && message.isRead === false) {
				// 		count++;
				// 	}
				// 	return count;
				// }, 0);

				const lastMessage = found.messages[found.messages.length - 1] || {};
				setTimeout(UnreadCounter.updateCount, 100);

				return update(state, { [threadIndex]: {
					$unset: ['needsMessageFetch'],
					$merge: {
						fetchedInitialMessages: true,
						messages: newMessages,
						lastMessage: found.lastMessage && found.lastMessage.messageId ? found.lastMessage
							: lastMessage,
						fetching: false,
						page: action.page,
						pageSize: action.pageSize,
						last: (action.resp && typeof action.resp.last === 'boolean') ? action.resp.last
							: false,
					},
				} });
			}
			action.messages =  action.messages || [];
			const lastMessage = action.messages[action.messages.length - 1] || {};
			const roomType = action.threadType;
			return [
				{
					id: action.threadID,
					type: roomType,
					name: action.threadID,
					naturalName: lastMessage.threadName,
					messages: action.messages,
					lastMessage: lastMessage,
					unreadCount: action.messages.length,
					fetchedInitialMessages: true,
					participants: [],
					needsUsersFetched: roomType === Consts.ROOM,
					inputBuffer: ''
				},
				...state,
			];
		}

		case Consts.CREATE_THREAD: {
			const threadIndex = state.findIndex(thread => thread.id == action.threadID);
			return threadIndex == -1 ? [
				{
					createdAt: new Date(),
					id: action.threadID,
					type: action.threadType || action.participants.length > 1 ? Consts.ROOM : Consts.ONE_TO_ONE,
					name: action.threadID,
					naturalName: action.roomNaturalName,
					participants: action.participants,
					unreadCount: 0,
					lastMessage: {},
					messages: [],
					inputBuffer: '',
					fetchedInitialMessages: action.fetchedInitialMessages,
					needsMessageFetch: typeof action.needsMessageFetch === 'boolean' ? action.needsMessageFetch : true
				},
				...state,
			] : state;
		}

		case Consts.REMOVE_THREAD: {
			const threadIndex = state.findIndex(thread => thread.id == action.threadID);
			return threadIndex > -1 ? update(state, { $splice: [[threadIndex, 1]] }) : state;
		}

		// TODO: manage removing users from thread, adding users to thread and turing thread from single
		// to room or room to single
		case Consts.UPDATE_THREAD: {
			const threadIndex = state.findIndex(thread => thread.id == action.threadID);
			return threadIndex > -1 ? update(state, {
				[threadIndex]: { participants: { $set: action.participants } },
			}) : state;
		}

		case Consts.CREATE_MESSAGE: {
			const threadIndex = state.findIndex(thread => thread.id == action.message.threadID);
			if (threadIndex > -1) {
				const found = state[threadIndex];
				action.message.participants = found.participants;
				action.message.delivery = action.message.delivery || {};
				found.participants.forEach((user) => {
					action.message.users = action.message.users || {};
					action.message.users[user.username] = user.name;
					action.message.delivery[Consts.SENDING] = action.message.delivery[Consts.SENDING] || [];
					action.message.delivery[Consts.SENDING].push({
						username: user.username
					});
				});

				return update(state, {
					[threadIndex]: {
						$unset: ['scrollTop'],
						$merge: { lastMessage: action.message, messageStateChanged: false },
						messages: { $push: [action.message] },
					},
				});
			}

			return state;
		}

		case Consts.RECEIVE_MESSAGE: {
			// Don't start processing received messagess until all messages
			// have been retrieved for loaded threads
			if (state.some((thread) => thread.id == action.message.threadID && !thread.fetchedInitialMessages)) {
				return state;
			}

			let newState = [];
			const threadIndex = state.findIndex(thread => thread.id == action.message.threadID);

			if (threadIndex > -1) {
				const found = state[threadIndex];
				if (!found.messages.find((message) => {
						return message.messageId && action.message.messageId &&
							message.messageId === action.message.messageId;
					})) {
					action.message.participants = found.participants;
					newState = update(state, { [threadIndex]: {
						$unset: ['typing'],
						$merge: {
							unreadCount: (found.unreadCount || 0) + 1,
							messageStateChanged: false,
							lastMessage: action.message
						},
						messages: { $push: [action.message] },
					}});
				}
			}
			else {
				newState = [
					...state,
					{
						id: action.message.threadID,
						type: action.message.type,
						name: action.message.threadName,
						naturalName: action.naturalName,
						messages: [action.message],
						lastMessage: action.message,
						unreadCount: 1,
						participants: [
							action.message.contact
						],
						needsMessageFetch: true,
						inputBuffer: ''
					},
				]
			}

			if (newState.length > 0) {
				notifications.notify('You have received a new message', 'From: ' + action.message.contact.name);
				setTimeout(UnreadCounter.updateCount, 100);

				return newState;
			}

			return state;
		}

		case Consts.RECEIVE_MESSAGE_ACK: {
			
			let messageIndex = 0;
			let threadIndex = state.findIndex((thread) => {
				messageIndex = thread.messages.findIndex(message =>
					message.messageId === action.message.messageUid);
				return messageIndex > -1;
			});
			if (threadIndex > -1) {
				let newMessage = { ...state[threadIndex].messages[messageIndex] };
				newMessage.messageId = action.message.messageId || action.message.messageUid;
				newMessage.delivery = newMessage.delivery || {};
				newMessage.delivery[Consts.ACKNOWLEDGED] = newMessage.delivery[Consts.ACKNOWLEDGED] || [];
				if(newMessage.type === Consts.ONE_TO_ONE) {
					newMessage.delivery[Consts.ACKNOWLEDGED].push({
						username: action.message.fromUsername
					});
				}
				else if (newMessage.users) {
					Object.keys(newMessage.users).forEach((user) => {
						newMessage.delivery[Consts.ACKNOWLEDGED].push({ username: user });
					});
				}

				// file has uploaded
				if (newMessage.fileLoading) {
					newMessage.fileLoading = false;
				}
				if (action.message.status === 'ERROR') {
					newMessage.error = action.message.description;
				}
				return update(state, { [threadIndex]: {
					$merge: { messageStateChanged: true },
					messages: { [messageIndex]: { $set: newMessage } },
				}});
			}
			console.log(`couldn't find message for ACK  ${action.message.messageUid}`, action.message);

			return state;
		}

		case Consts.RECEIVE_MESSAGE_STATUS: {
			// TODO: handle this for rooms?
			let messageIndex = 0;
			let threadIndex = state.findIndex((thread) => {
				messageIndex = thread.messages.findIndex(message => message.messageId === action.message.messageId);
				return messageIndex > -1;
			});
			if (threadIndex > -1) {
				const found = state[threadIndex];
				let newMessage = { ...state[threadIndex].messages[messageIndex] };
				newMessage.delivery = newMessage.delivery || {};
				if (found.type === Consts.ROOM) {
					newMessage.delivery[action.message.status] = newMessage.delivery[action.message.status] || [];
					newMessage.delivery[action.message.status].push({ username: action.message.fromUsername });
				}
				else {
					newMessage.delivery[action.message.status] = true;
				}
				return update(state, { [threadIndex]: {
					$merge: { messageStateChanged: true },
					messages: { [messageIndex]: { $set: newMessage } },
				}});
			}
			console.log(`couldn't find message for status update ${action.message.messageId}`, action.message);
			return state;
		}

		case Consts.UPDATE_MESSAGE_STATUS: {
			let messageIndex = 0;
			let threadIndex = state.findIndex((thread) => {
				messageIndex = thread.messages.findIndex(message => message.messageId === action.message.messageId);
				return messageIndex > -1;
			});
			if (threadIndex > -1) {
				const found = state[threadIndex];
				const newMessage = _.cloneDeep(state[threadIndex].messages[messageIndex]);
				const users = newMessage.participants || usersToParticipants(newMessage.users) || [];
				newMessage.delivery = newMessage.delivery || {};
				newMessage.delivery[action.status] = (newMessage.delivery[action.status] || [])
					.concat(users.map(u => ({ username: u.username })));
				
				if (action.status === Consts.RETRY) {
					_.assign(newMessage, {
						delivery: _.omit(newMessage.delivery, [Consts.SENDING_FAILED]),
					});
				}

				return update(state, { [threadIndex]: {
					// $merge: { messageStateChanged: true },
					messages: { [messageIndex]: { $set: newMessage } },
				}});
			}
			console.log(`couldn't find message for status update ${action.message.messageId}`, action.message);
			return state;
		}

		case Consts.FETCH_ROOMS_SUCCESS: {
			const updates = {};
			action.rooms.forEach((room) => {
				const threadIndex = state.findIndex(thread => thread.name === room.name);

				if (threadIndex > -1 && state[threadIndex].naturalName !== room.naturalName) {
					_.assign(updates, { [threadIndex]: { $merge: { naturalName: room.naturalName } } });
				}
			});

			return update(state, updates);
		}

		case Consts.FETCH_USERS_FOR_ROOM: {
			const threadIndex = state.findIndex(thread => thread.name === action.roomName);

			if (threadIndex > -1) {
				return update(state, action.disable ? { $splice: [[threadIndex, 1]] } : {
					[threadIndex]: { participants: { $set: action.users } },
				});
			}
			return state;
		}

		case Consts.RECEIVE_IS_TYPING: {
			const threadIndex = state.findIndex(thread => thread.id == action.threadID);

			if (threadIndex > -1) {
				const newTypings = state[threadIndex].typing ? _.clone(state[threadIndex].typing) : [];
				if (newTypings.indexOf(action.typing) === -1) {
					newTypings.push(action.typing);
				}
				return update(state, { [threadIndex]: { typing: { $set: newTypings } } });
			}

			return state;
		}

		case Consts.RECEIVE_STOPPED_TYPING: {
			const threadIndex = state.findIndex(thread => thread.id == action.threadID);

			if (threadIndex > -1) {
				const newTypings = state[threadIndex].typing ? _.clone(state[threadIndex].typing) : [];
				newTypings.splice(newTypings.indexOf(action.typing), 1);
				return update(state, { [threadIndex]: { typing: { $set: newTypings } } });
			}

			return state;
		}

		case Consts.MESSAGE_HAS_BEEN_READ: {
			const threadIndex = state.findIndex(thread => thread.id == action.message.threadID);

			if (threadIndex > -1) {
				const messageIndex = state[threadIndex].messages.findIndex((msg) => {
					return (action.message.messageId && msg.messageId === action.message.messageId) ||
						(action.message.messageUid && msg.messageUid === action.message.messageUid);
				});

				if (messageIndex > -1) {
					setTimeout(UnreadCounter.updateCount, 100);
				}
				return update(state, { [threadIndex]: {
					$merge: (messageIndex > -1 ? { unreadCount: Math.max(state[threadIndex].unreadCount - 1, 0) } : {}),
					...(messageIndex > -1 ? { messages: { [messageIndex]: { $merge: { isRead: true } } } } : {}),
				}});
			}

			return state;
		}

		case Consts.NEW_SCROLL_POSITION: {
			const threadIndex = state.findIndex(thread => thread.id == action.threadID);
			return threadIndex > -1 ? update(state, { [threadIndex]: {
				$merge: { scrollTop: action.scrollTop },
			}}) : state;
		}

		case Consts.RENAME_ROOM: {
			const threadIndex = state.findIndex(thread => thread.id == action.threadID);
			return threadIndex > -1 ? update(state, { [threadIndex]: {
				$merge: { naturalName: action.roomNaturalName },
			}}) : state;
		}

		case Consts.FETCH_THREAD_SUCCESS: {
			const threadIndex = state.findIndex(thread => thread.id == action.thread.name);
			return threadIndex === -1 ? [
				{
					createdAt: new Date(),
					id: action.thread.name,
					type: action.thread.type,
					name: action.thread.name,
					naturalName: action.thread.naturalName,
					messages: [],
					lastMessage: action.thread.lastMessage,
					unreadCount: action.thread.unreadCount || 0,
					participants: action.thread.users,
					needsMessageFetch: true,
					inputBuffer: ''
				},
				...state,
			] : state;
		}

		case Consts.SET_SEARCH: {
			const { searchedMessagesID, existingMessagesID, threadID, threadExist } = action;
			const threadIndex = state.findIndex(thread => thread.id == threadID);

			if ( threadIndex > -1 ) {
				const newThread = { ...newState[threadIndex] };

				if ( threadExist ) {
					// setting a flag that tell that this thread existed before
					newThread.existedBeforeSearch = true;
				}
				else {
					newThread.unreadCount -= searchedMessagesID.length;
					newThread.unreadCount = Math.max(newThread.unreadCount || 0, 0);
				}

				newThread.messages.forEach((message) => {
					if ( searchedMessagesID.indexOf(message.messageId) > -1) {
						// will display or hide messages based on this.
						message.isSearchResult = true;

						// we flag this message so we will know not to remove it later
						if ( existingMessagesID.indexOf(message.messageId) > -1) {
							message.existedBeforeSearch = true;
						}
					}
				});

				return update(state, { [threadIndex]: { $set: newThread } });
			}

			return state;
		}

		case Consts.CLEAR_SEARCH: {
			const threadIndex = state.findIndex(thread => thread.id == action.threadID);

			if ( threadIndex > -1 ) {
				const found = state[threadIndex];

				if ( !found.existedBeforeSearch ) {
					// thread did not exist before search - nullifying and removing
					return update(state, { $splice: [[threadIndex, 1]] });
				}

				const newMessages = found.messages.filter(m => !m.isSearchResult || m.existedBeforeSearch)
					.map(m => (m.isSearchResult ? update(m, { $unset: ['isSearchResult', 'existedBeforeSearch']}) : m));

				return update(state, { [threadIndex]: {
					$unset: ['existedBeforeSearch'],
					messages: { $set: newMessages },
				}});
			}
			return state;
		}

		case Consts.STASH_MESSAGE:
			const threadIndex = state.findIndex(thread => thread.id == action.threadID);

			if ( threadIndex > -1 ) {
				return update(state, { [threadIndex]: { $merge: { inputBuffer: action.input } } });
			}
			return state;

		/*
		case Consts.ROOM_LEAVE: {
			console.log('state, action, ROOM_LEAVE', state, action);
			let found = state.find((thread) => {
				return thread.id == action.roomName;
			});

			if (found) {
				const index = found.participants.findIndex((participant) => {
					return participant.username === action.username;
				});

				if (index > -1) {
					found.participants.splice(index, 1);
				}

				return [
					...state
				];
			}
			return state;
		}*/

		case Consts.LOGOUT: {
			return [];
		}

		default:
			return state;
	}
}
