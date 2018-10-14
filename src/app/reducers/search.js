import * as Consts from '../configs/constants';

// unfortunate workaround for https://phabricator.babeljs.io/T6777
typeof undefined;

export default function search(state = [], action) {
	switch (action.type) {
		case Consts.SET_SEARCH: {
			return {
				... state,
				jumpToMessageID: action.jumpToMessageID,
				searchedMessagesID: action.searchedMessagesID,
				existingMessagesID: action.existingMessagesID,
				threadID: action.threadID,
				threadExist: action.threadExist
			}
		}

		case Consts.CLEAR_SEARCH: {
			return {
				... state,
				jumpToMessageID: null,
				searchedMessagesID: null,
				existingMessagesID: null,
				threadID: action.threadID,
				threadExist: null
			}
		}
		default: {
			return state;
		}
	}
}