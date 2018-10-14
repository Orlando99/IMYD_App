import * as Consts from '../configs/constants';
import initializeSocket from '../lib/webSocket/socket';
import * as Utils from '../utils/index';
import * as auth from '../utils/auth';
import * as authService from '../services/auth';
import { fetchUserProfile, fetchFlags } from './profile';
import * as generalAction from '../actions/general';
import * as contactAction from '../actions/contacts';

export function updateJustLoggedIn(justLoggedIn) {
	return {
		type: Consts.UPDATE_JUST_LOGGED_IN,
		justLoggedIn
	}
}

function buildPostLogInFailureAction(error) {
	return {
		type: Consts.LOGIN_FAILURE,
		error
	}
}

export function postLogIn(username, password) {
	return dispatch => {
		auth.removeToken();
		return authService.login({ username, password }).then((res) => {
			dispatch(updateJustLoggedIn(true));
			return dispatch(fetchAuthToken(username, password))
				.then(() => { return dispatch(initWebChat()) });
		}).catch(function(err) {
			let res = err && err.response && err.response.data || {};
			const message = Utils.getError( res.errorCode || res.status);
			dispatch(buildPostLogInFailureAction(message || 'We are unable to handle your login request'));
			return Promise.reject(err);
		});
	}
}

export function postLogOut(skipRequest) {
	return dispatch => {
		auth.removeToken();

		if (skipRequest) {
			dispatch({
				type: Consts.LOGOUT
			});
			return;
		}

		return authService.logout().then((res) => {
			dispatch({ type: Consts.LOGOUT });
			return Promise.resolve(res);
		}).catch(function(err) {
			console.log('logout error: ' + err.message);
			return Promise.reject(err);
		});
	}
}

export function ping(skipAuthToken) {
	return dispatch => {
		return authService.extendSession().then((res) => {
			if (skipAuthToken) {
				return;
			}
			return fetchAuthToken()(dispatch)
				.then(() => { return dispatch(initWebChat()) });
		}).catch((err) => {
			console.log('ping failed - not logged in', err);
			if (skipAuthToken) {
				dispatch({
					type: Consts.LOGOUT
				});
			}
			return Promise.reject(err);
		});
	}
}

export function fetchAuthToken(username, password) {
	return dispatch => {
		return new Promise((resolve, reject) => {

			const token = auth.getToken();
			if (token) {
				return resolve(token);
			}

			else if( username && password ) {

				dispatch({
					type: Consts.FETCHING_TOKEN
				});
				
				return authService.fetchAuthToken({username, password}).then((res) => {
					return resolve(res);
				}).catch((err) => {
					return reject(err);
				});
			}
		}).catch(console.log);
	}
}

export function initWebChat() {
	return dispatch => {
		initializeSocket().then(() => {
			dispatch(generalAction.readyForChatting());
			dispatch(contactAction.acceptExternalInvite());
			fetchUserProfile()(dispatch, () => {
				dispatch(fetchFlags());
			});
		}).catch((err) => {
			console.log('error connecting to socket: ', err);
		});
	};
}