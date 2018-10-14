import * as Consts from '../configs/constants';
import * as rooms from './../services/rooms';

export function setSearch({ jumpToMessageID, searchedMessagesID, existingMessagesID, threadID, threadExist }) {
	return {
		type: Consts.SET_SEARCH,
		jumpToMessageID,
		searchedMessagesID,
		existingMessagesID,
		threadID,
		threadExist
	};
}

export function clearSearch(threadID) {
	return {
		type: Consts.CLEAR_SEARCH,
		threadID
	};
}


