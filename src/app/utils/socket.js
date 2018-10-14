import { getStoreState } from './store';

export function getSocket() {
	const storeState = getStoreState();
	if ( storeState && storeState.webSocket && storeState.webSocket.socket) {
		return storeState.webSocket.socket;
	}
	return false;
}

export function isSocketConnected(message) {
	const socket = getSocket();
	if (!socket || !socket.connected) {
		console.log(createErrorMessage(message));
		return false;
	}
	return true;
}

export function createErrorMessage(message) {
	return 'ERROR: Cannont send ' + message + ' because there is not a live socket';
}