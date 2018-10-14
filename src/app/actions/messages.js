import * as messagesService from '../services/messages';
import * as Consts from '../configs/constants';
import * as Utils from '../utils/index';
import * as auth from '../utils/auth';

export function receiveNewMessage(message) {
	return {
		type: Consts.RECEIVE_MESSAGE,
		message,
	};
}

export function postNewMessage(message) {
	return {
		type: Consts.CREATE_MESSAGE,
		message,
	};
}

export function postMessageRead(message) {
	return {
		type: Consts.MESSAGE_HAS_BEEN_READ,
		message,
	}
}

export function buildFetchMessagesSuccessAction(threadID, messages, page, pageSize, isRoom, user, resp) {
	return {
		type: Consts.FETCH_MESSAGES_SUCCESS,
		page,
		pageSize,
		messages,
		threadID,
		threadType: isRoom ? Consts.ROOM : Consts.ONE_TO_ONE,
		user,
		resp
	}
}

function buildFetchMessagesFailureAction(threadID, error) {
	return {
		type: Consts.FETCH_MESSAGES_FAILURE,
		threadID,
		error
	}
}

export function fetchMessages(threadID, toUsername, currentUsername, page = 0, pageSize = Consts.PAGE_SIZE, user) {
	return (dispatch) => {
		dispatch({
			type: Consts.FETCH_MESSAGES,
			threadID
		});
		messagesService.fetchMessages({ toUsername, page, pageSize }).then((res) => {
			let threadID = Utils.buildThreadID(toUsername, currentUsername);
			dispatch(buildFetchMessagesSuccessAction(threadID, res.data.content || [], page, pageSize, false, user, res.data));
		}).catch((err) => {
			dispatch(buildFetchMessagesFailureAction(threadID, err.message));
		});
	}
}

export function fetchMessagesForRoom(roomName, page = 0, pageSize = Consts.PAGE_SIZE, user) {
	return (dispatch) => {
		dispatch({
			type: Consts.FETCH_MESSAGES,
			threadID: roomName
		});

		messagesService.fetchMessagesForRoom({ roomName, page, pageSize }).then((res) => {
			dispatch(buildFetchMessagesSuccessAction(roomName, res.data.content || [], page, pageSize, true, user, res.data));
		}).catch((err) => {
			dispatch(buildFetchMessagesFailureAction(roomName, err.message));
		});
	}
}

export function receiveMessageAcknowledgement(message) {
	return {
		type: Consts.RECEIVE_MESSAGE_ACK,
		message,
	};
}

export function receiveMessageStatus(message) {
	return {
		type: Consts.RECEIVE_MESSAGE_STATUS,
		message,
	};
}

export function updateMessageStatus(message, status) {
	return {
		type: Consts.UPDATE_MESSAGE_STATUS,
		message,
		status,
	}
}

export function stashMessage(threadID, input) {
	return {
		type: Consts.STASH_MESSAGE,
		threadID,
		input,
	}
}
