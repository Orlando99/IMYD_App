import * as contactServices from '../services/contacts';
import * as Consts from '../configs/constants';

export function fetchContactRequestSuccessAction(requests, concatRequest) {
	return {
		type: Consts.FETCH_CONTACTS_REQUESTS_SUCCESS,
		requests,
		concatRequest
	};
}

export function addContactRequestAction(requestType, request) {
	return {
		type: Consts.ADD_CONTACTS_REQUESTS,
		requestType,
		request
	};
}


// hacky solution for accepted invitations.
export function acceptInvitationAction(pendingItem) {
	return {
		type: Consts.CONTACT_ACCEPTED,
		pendingItem
	};
}

export function acceptInvitation(pendingItem) {
	return (dispatch) => {
		return new Promise((resolve, reject ) => {
			const username = pendingItem.contact.username;
			contactServices.acceptInvitation(username)
				.then(() => {
					dispatch(acceptInvitationAction(pendingItem));
					return resolve();
				})
				.catch((err) => { return reject(err); });
		});
	}
}

// hacky solution for accepted invitations.
export function declineInvitationAction(pendingItem) {
	return {
		type: Consts.CONTACT_DECLINED,
		pendingItem
	};
}

export function declineInvitation(pendingItem) {
	return (dispatch) => {
		return new Promise((resolve, reject ) => {
			const username = pendingItem.contact.username;
			contactServices.declineInvitation(username)
				.then(() => {
					dispatch(declineInvitationAction(pendingItem));
					return resolve();
				})
				.catch((err) => { return reject(err); });
		});
	}
}