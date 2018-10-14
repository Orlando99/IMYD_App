import * as Consts from '../configs/constants';

// unfortunate workaround for https://phabricator.babeljs.io/T6777
typeof undefined;

const defaultState = {
	pending: [],
	declined: [],
	sent: [],
	sentExternal: []
};

export default function pendingRequests(state = defaultState, action) {
	switch (action.type) {
		case Consts.FETCH_CONTACTS_REQUESTS_SUCCESS: {
			let requestType = action.concatRequest;
			if ( requestType ) {
				action.requests[requestType] = state[requestType].concat(action.requests[requestType]);
			}
			return {
				...state,
				...action.requests
			}
		}
		case Consts.ADD_CONTACTS_REQUESTS: {
			const { requestType, request } = action;
			return {
				...state,
				[requestType]: [...(state[requestType] || []), request],
			}
		}/*
		case Consts.REMOVE_CONTACTS_REQUESTS: {

			return {
				...state,
				...action.requests
			}
		}*/
		case Consts.CONTACT_ACCEPTED: {
			const username =  action.pendingItem.contact.username;
			return {
				...state,
				pending: state.pending.filter(item => item.contact.username !== username),
				declined: state.declined.filter(item => item.contact.username !== username),
				username,
			};
		}
		case Consts.CONTACT_DECLINED: {
			const username =  action.pendingItem.contact.username;
			return {
				...state,
				pending: state.pending.filter(item => item.contact.username !== username),
				declined: state.declined.filter(item => item.contact.username !== username)
					.conat([action.pendingItem]),
			};
		}

		default: {
			return state;
		}
	}
}
