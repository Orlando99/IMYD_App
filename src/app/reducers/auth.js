import update from 'immutability-helper';

import * as Consts from '../configs/constants';
import * as Utils from '../utils/index';

// unfortunate workaround for https://phabricator.babeljs.io/T6777
typeof undefined;

export default function auth(state = {}, action) {
	switch (action.type) {

		case Consts.FETCH_PROFILE_SUCCESS: {
			return {
				...state,
				user: action.user
			};
		}

		case Consts.FETCH_EMR_INTEGRATION: {
			return {
				...state,
				user: Object.assign({}, state.user, {emr: action.emr})
			}
		}

		case Consts.PROFILE_CHANGED: {
			return {
				...state,
				user: Object.assign({}, state.user, action.userChanges)
			};
		}

		case Consts.FETCH_THREADS_SUCCESS: {
			action.threads.forEach(thread => {
				if (thread.users) {
					thread.users = thread.users.filter(user => user.username !== state.user.username);
				}
			});
			return state;
		}

		case Consts.FETCH_USERS_FOR_ROOM: {
			if (action.users) {
				action.users = action.users.filter(user => user.username !== state.user.username);
			}
			return state;
		}

		case Consts.FETCH_FLAGS_SUCCESS: {
			return {
				...state,
				flags: action.flags,
			}
		}

		case Consts.SAVE_FLAG_SUCCESS: {
			const flagIndex = state.flags.findIndex(flag => flag.flagType === action.flag.flagType);
			return flagIndex > -1 ? update(state, { flags: { [flagIndex]: {
				$merge: { value: action.flag.value },
			}}}) : state;
		}

		case Consts.SOCKET_INITIALIZED: {
			return {
				...state,
				authenticated: true
			};
		}

		case Consts.FETCH_PROFILE_FAILURE: {
			return {
				loginError: action.error
			};
		}

		case Consts.FETCHING_PROFILE: {
			return {
				...state,
				fetchingProfile: true
			}
		}

		case Consts.FETCHING_TOKEN: {
			return {
				...state,
				fetchingToken: true
			}
		}

		case Consts.UPDATE_JUST_LOGGED_IN: {
			return {
				...state,
				justLoggedIn: action.justLoggedIn
			};
		}

		case Consts.LOGIN_FAILURE: {
			return {
				loginError: action.error
			};
		}

		case Consts.LOGOUT: {
			location.reload();
			return state;
		}

		default: {
			return state;
		}
	}
}
