import * as request from 'axios';
import { getRequestUrl } from './../utils/index';
import { getToken } from './../utils/auth';

export function fetchMessages({ toUsername, page, pageSize }) {
	return request.get(getRequestUrl(`/api/v1/communication/oneToOnes/${toUsername}/messages?page=${page}&size=${pageSize}`), { headers: { 'x-auth-token': getToken() } } )
}

export function fetchMessageFile({ messageId, fileName }) {
	console.log('fetchMessageFile:', messageId, fileName);
  return request.get(getRequestUrl(`/api/v1/attachments/${messageId}/${fileName}`), { headers: { 'x-auth-token': getToken() } } )
}

export function fetchMessagesForRoom({ roomName, page, pageSize }) {
	return request.get(getRequestUrl(`/api/v1/communication/rooms/${roomName}/messages?page=${page}&size=${pageSize}`), { headers: { 'x-auth-token': getToken() } } )
}

export function searchMessage({ page = 0, size = 20, term, sort = 'timestamp%2Casc' }) {
	if(!term) {
		return false;
	}
	const url = getRequestUrl(`/api/v1/communication/messages/search?page=${page}&size=${size}&term=${term}&sort=${sort}`);
	return request.get(url, { headers: { 'x-auth-token': getToken() } } );
}

export function searchRelatedMessagesInRoom({ roomName, containingMessageId, page = 0, size = 20, term, sort = 'timestamp%2Casc' }) {
	if(!roomName || !containingMessageId) {
		return false;
	}
	const url = getRequestUrl(`/api/v1/communication/rooms/${roomName}/messages?containingMessageId=${containingMessageId}&page=${page}&size=${size}&sort=${sort}`);
	return request.get(url, { headers: { 'x-auth-token': getToken() } } );
}

export function searchRelatedMessagesInOneOnOne({ convUsername, containingMessageId, page = 0, size = 20, sort = 'timestamp%2Casc' }) {
	if(!convUsername || !containingMessageId) {
		return false;
	}
	const url = getRequestUrl(`/api/v1/communication/oneToOnes/${convUsername}/messages?containingMessageId=${containingMessageId}&page=${page}&size=${size}&sort=${sort}`);
	return request.get(url, { headers: { 'x-auth-token': getToken() } } );
}