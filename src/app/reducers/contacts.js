import * as Consts from '../configs/constants';
import { syncWithContacts } from './../utils/array'

// unfortunate workaround for https://phabricator.babeljs.io/T6777
typeof undefined;

export default function contacts(state = [], action) {
	switch (action.type) {
		case Consts.FETCH_CONTACTS_SUCCESS: {
			return (action.contacts || []).map((contact) => {
				contact.jobTitle = contact.jobTitle ? contact.jobTitle.name || '' : '';
				contact.practiceType = contact.practiceType ? contact.practiceType.name || '' : '';
				return contact;
			});
		}

		case Consts.FETCH_THREADS_SUCCESS: {
			action.threads.forEach((thread) => {
				if (thread.users) {
					thread.users = thread.users.map(user => syncWithContacts(state, user));
				}
			});
			return state;
		}

		case Consts.FETCH_MESSAGES_SUCCESS: {
			action.messages.forEach((message) => {
				message.contact = syncWithContacts(state, message.sender);
			});
			return state;
		}

		case Consts.FETCH_USERS_FOR_ROOM: {
			if (!action.disable) {
				action.users = action.users.filter(u => !!u).map(u => syncWithContacts(state, u));
			}
			return state;
		}

		case Consts.RECEIVE_MESSAGE: {
			if (!action.message.contact) {
				action.message.contact = syncWithContacts(state, action.message.sender);
			}
			return state;
		}

		case Consts.RECEIVE_IS_TYPING:
		case Consts.RECEIVE_STOPPED_TYPING: {
			const found = state.find(user => user.username === action.typing);
			if (found) {
				action.typing = found.name || found.username;
			}
			return state;
		}

		case Consts.LOGOUT: {
			return [];
		}

		default: {
			return state;
		}
	}
}
