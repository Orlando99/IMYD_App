import * as Consts from '../configs/constants';

export function pingCurrentTime(currentTime) {
	return {
		type: Consts.PING_CURRENT_TIME,
		currentTime
	};
}

export function resetAudioNotification() {
	return {
		type: Consts.RESET_AUDIO_NOTIFICATION
	};
}

export function playAudioNotification(feedback) {
	return {
		type: Consts.PLAY_AUDIO_NOTIFICATION
	};
}

export function pauseAudioNotification(feedback) {
	return {
		type: Consts.PAUSE_AUDIO_NOTIFICATION
	};
}

export function newNotification(message) {
	return {
		type: Consts.NEW_NOTIFICATION,
		message
	};
}

export function resetNotification() {
	return {
		type: Consts.RESET_NOTIFICATION
	};
}

export function setFeedback(feedback) {
	feedback.date = feedback.date || Date.now();
	return {
		type: Consts.SET_FEEDBACK,
		feedback
	};
}

export function receiveIsTyping(who, threadID) {
	return {
		type: Consts.RECEIVE_IS_TYPING,
		typing: who,
		threadID
	};
}

export function receiveStoppedTyping(who, threadID) {
	return {
		type: Consts.RECEIVE_STOPPED_TYPING,
		typing: who,
		threadID
	};
}

function buildPostNewScrollPositionAction(scrollTop, threadID) {
	return {
		type: Consts.NEW_SCROLL_POSITION,
		scrollTop,
		threadID
	}
}

export function postNewScrollPosition(scrollTop, threadID) {
	return dispatch => {
		dispatch(buildPostNewScrollPositionAction(scrollTop, threadID));
	}
}

export function readyForChatting() {
	return dispatch => {
		dispatch({
			type: Consts.SOCKET_INITIALIZED
		});
	}
}

export function setSocket(socket = null) {
	return {
		type: Consts.SET_SOCKET,
		socket
	}
}