import * as Consts from '../configs/constants';
import * as Utils from '../utils/index';
import * as auth from '../utils/auth';
import * as threadsService from './../services/threads';
import { fetchUsersForRoom, fetchRooms } from './rooms';
import { fetchMessagesForRoom, fetchMessages } from './messages';

export function fetchThreadSuccessAction(thread, threadName) {
	return {
		type: Consts.FETCH_THREAD_SUCCESS,
		thread,
		threadName
	};
}

export function fetchThreadFailAction(error) {
	return {
		type: Consts.FETCH_THREAD_FAILURE,
		error
	};
}

export function fetchThread(threadName) {
	return (dispatch) => {
		return threadsService.fetchThread(threadName).then((resp)=> {
			if(resp && resp.data && resp.data.name) {
				dispatch(fetchThreadSuccessAction(resp.data));
			}
		}).catch((err) => {
			dispatch(fetchThreadFailAction(err));
			dispatch(fetchRooms());
		});
	}
}

function changeThreadAction(threadID) {
	return {
		type: Consts.CHANGE_THREAD,
		threadID
	}
}

export function postChangeThread(threadID) {
	return dispatch => {
		dispatch(changeThreadAction(threadID));
	}
}

export function createNewThread(threadID, participants, roomNaturalName, threadType) {
	return {
		type: Consts.CREATE_THREAD,
		threadID,
		participants,
		roomNaturalName,
		threadType,
		needsMessageFetch: false,
		fetchedInitialMessages: true
	}
}

export function postNewThread(threadID, participants, roomNaturalName, threadType) {
	return {
		type: Consts.CREATE_THREAD,
		threadID,
		participants,
		roomNaturalName,
		threadType
	};
}

export function removeThreadAction(threadID) {
	return {
		type: Consts.REMOVE_THREAD,
		threadID
	}
}

export function postRemoveThread(threadID) {
	return dispatch => {
		dispatch(removeThreadAction(threadID));
	}
}

function updateThreadAction(threadID, participants) {
	return {
		type: Consts.UPDATE_THREAD,
		threadID,
		participants
	}
}

export function postUpdateThread(threadID, participants) {
	return dispatch => {
		dispatch(updateThreadAction(threadID, participants));
	}
}

function buildFetchThreadsSuccessAction(threads, more) {
	return {
		type: Consts.FETCH_THREADS_SUCCESS,
		threads,
		more
	}
}

function buildFetchThreadsFailureAction(error) {
	return {
		type: Consts.FETCH_THREADS_FAILURE,
		error
	}
}

export function fetchThreads(user, page = 0, pageSize = Consts.PAGE_SIZE) {
	return dispatch => {
		return threadsService.fetchThreads(page, pageSize).then((res)=> {
			const threads = res.data.content || [];
			dispatch(buildFetchThreadsSuccessAction(threads, !res.data.last));
			threads.forEach(thread => {
				let name;

				if (thread.type === Consts.ROOM) {
					name = thread.name;
					dispatch(fetchUsersForRoom(name));
					dispatch(fetchMessagesForRoom(thread.name, 0, Consts.PAGE_SIZE, user));
				}
				else {
					name = (thread.participants[0] || {}).username;
					dispatch(fetchMessages(thread.name, name, user.username, 0, Consts.PAGE_SIZE, user));
				}
			});
		}).catch((err) => {
			dispatch(buildFetchThreadsFailureAction(err.message));
		});
	}
}