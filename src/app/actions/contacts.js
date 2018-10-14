import cookies from 'my-simple-cookie';
import * as contactServices from '../services/contacts';
import * as Consts from '../configs/constants';
import * as Utils from '../utils/index';
import { getUser } from '../utils/auth';
import { prepareSentExternalRequests } from '../utils/contacts';
import { fetchRooms } from './rooms';
import { fetchThreads } from './threads';
import { setFeedback } from './general';
import { fetchContactRequestSuccessAction } from './PendingRequests';

function buildFetchContactsSuccessAction(contacts) {
	return {
		type: Consts.FETCH_CONTACTS_SUCCESS,
		contacts
	};
}

export function fetchContacts(user) {
	return dispatch => {
		return contactServices.fetchContacts().then((res) => {
			dispatch(buildFetchContactsSuccessAction(res.data));
			dispatch(fetchThreads(user));
			dispatch(fetchRooms());
			return Promise.resolve(res);
		}).catch((err) => {
			if (err) {
				console.log('error fetching contacts');
				// TODO: build error
			}
			dispatch(fetchThreads(user));
			dispatch(fetchRooms());
			return Promise.reject(err);
		});
	};
}

export function sendContactRequest(username, name) {
	return (dispatch) => {
		return contactServices.sendContactRequest(username).then((res) => {
			const feedbackType = 'success';
			const message = `Your invitation to connect has been sent. Once ${ name || username } accepts your request you will be notified and can then begin messaging`;
			dispatch(setFeedback({ feedbackType, message, show: true }));
			return Promise.resolve(res);
		}).catch((err) => {
			let res = err && err.response && err.response.data || {};
			console.log('sending contact request error', res.message || res);
			const message = res.message || Utils.getError( res.errorCode || res.status);
			dispatch(setFeedback({ feedbackType: 'error', message, show: true }));
			return Promise.reject(message);
		});
	};
}

export function sendExternalInvite(data) {
	return (dispatch) => {
		return contactServices.sendExternalInvite(data).then((res) => {
			const feedbackType = 'success';
			const message = `Your message and invitation to connect has been sent to ${data.inviteeFirstName + ' ' + data.inviteeLastName} at ${data.inviteeEmail}.`;
			dispatch(setFeedback({ feedbackType, message, show: true }));
			return Promise.resolve(res);
		}).catch((err) => {
			let res = err && err.response && err.response.data || {};
			console.log('sending contact request error', res.message || res);
			const message = res.message || Utils.getError( res.errorCode || res.status);
			dispatch(setFeedback({ feedbackType: 'error', message, show: true }));
			return Promise.reject(message);
		});
	};
}

export function fetchContactInvitations() {
	return (dispatch) => {
		return contactServices.fetchContactInvitations().then((res) => {
			const results = res.data || [];
			const pending = results.filter((invite) => {
				return invite.status === 'PENDING';
			});
			const declined = results.filter((invite) => {
				return invite.status === 'DECLINED';
			});

			dispatch(fetchContactRequestSuccessAction({
				pending: pending,
				declined: declined
			}));

		}).catch((err) => {
			console.log('error fetching invitations received');
		});
	};
}

export function fetchSentContactInvitations() {
	return (dispatch) => {
		return contactServices.fetchSentContactInvitations().then((res) => {
			dispatch(fetchContactRequestSuccessAction({
				sent: res.data || []
			}));
		}).catch((err) => {
			console.log('error fetching invitations sent');
		});
	};
}

export function getAllExternalInvite(params) {
	return (dispatch) => {
		return contactServices.getAllExternalInvite(params).then((res) => {
			let user = getUser();
			let hospitals = user && user.hospitals || [];
			let request = {
				sentExternal: prepareSentExternalRequests(res.data && res.data.content || [], hospitals),
				sentExternalLast: res.data.last
			};
			let concatRequest = params && params.page ? 'sentExternal' : false;
			dispatch(fetchContactRequestSuccessAction(request, concatRequest));

		});
	};
}

export function fetchContactRequests() {
	return (dispatch) => {
		dispatch(fetchContactInvitations());
		dispatch(fetchSentContactInvitations());
		dispatch(getAllExternalInvite());
	};
}


export function acceptExternalInvite() {
	return (dispatch) => {
		return new Promise((resolve, reject ) => {
			const token = cookies.get('invToken');
			if( !token ) {
				return resolve();
			}
			contactServices.acceptExternalInvite(token).then((res) => {
				cookies.remove('invToken');
				return resolve(res);
			}).catch((err) => {
				return reject(err);
			})
		});
	};
}