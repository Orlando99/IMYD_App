import * as request from 'axios';
import { getRequestUrl, getError } from './../utils/index';
import { getToken } from './../utils/auth';

export function fetchContacts() {
	return request.get(getRequestUrl('/api/v1/contacts'), { headers: { 'x-auth-token': getToken() } } );
}

export function sendContactRequest(username) {
	return request.post(getRequestUrl(`/api/v1/contacts/invitations/${username}/send`), null, { headers: { 'x-auth-token': getToken() } } );
}

export function acceptInvitation(username) {
	return request.post(getRequestUrl(`/api/v1/contacts/invitations/${username}/approve`), null, { headers: { 'x-auth-token': getToken() } }).catch((err) => {
		let res = err && err.response && err.response.data || {};
		const message = res.message || getError( res.errorCode || res.status);
		return Promise.reject(message, err);
	});
}

export function declineInvitation(username) {
	return request.post(getRequestUrl(`/api/v1/contacts/invitations/${username}/decline`), null, { headers: { 'x-auth-token': getToken() } } ).catch(function(err) {
		let res = err && err.response && err.response.data || {};
		const message = res.message || getError( res.errorCode || res.status);
		return Promise.reject(message);
	});
}

export function fetchContactsSearch(params) {
	return request.get(getRequestUrl(`/api/v1/contacts/search?term=${params.data.query || ''}&page=${params.data.page-1}`), { headers: { 'x-auth-token': getToken() } } );
}

export function fetchContactInvitations() {
	return request.get(getRequestUrl(`/api/v1/contacts/invitations/received`), { headers: { 'x-auth-token': getToken() } } );
}

export function fetchSentContactInvitations() {
	return request.get(getRequestUrl(`/api/v1/contacts/invitations/sent/PENDING`), { headers: { 'x-auth-token': getToken() } } );
}



export function sendExternalInvite(data) {
	return request.post(getRequestUrl(`/api/v1/invitation/sendInvite`), data, { headers: { 'x-auth-token': getToken() } } );
}

export function acceptExternalInvite(token) {
	return request.post(getRequestUrl(`/api/v1/invitation/acceptInvite?token=${token}`), null, { headers: { 'x-auth-token': getToken() } } );
}

export function getAllExternalInvite(params = {}) {
	return request.get(getRequestUrl(`/api/v1/invitation/findAllInvitesForSender?page=${params.page || 0}&size=${params.size || 10}`), { headers: { 'x-auth-token': getToken() } } );
}

export function openExternalInvite(token) {
	return request.get(getRequestUrl(`/api/v1/invitation/openInvite?token=${token}`));
}
