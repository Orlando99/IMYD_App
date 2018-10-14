import * as profileService from '../services/profile';
import * as Consts from '../configs/constants';
import { fetchContacts, fetchContactRequests } from './contacts';
import { setFeedback } from './general';
import * as Utils from '../utils/index';

function buildFetchProfileSuccessAction(user) {
	return {
		type: Consts.FETCH_PROFILE_SUCCESS,
		user
	}
}

function buildFetchEmrIntegration(emr) {
	return {
		type: Consts.FETCH_EMR_INTEGRATION,
		emr
	}
}

function buildFetchProfileFailureAction(error) {
	return {
		type: Consts.FETCH_PROFILE_FAILURE,
		error
	}
}

export function profileChangedAction(userChanges){
	return {
		type: Consts.PROFILE_CHANGED,
		userChanges
	}
}

export function updatingWebSettings() {
	return {
		type: Consts.UPDATING_WEB_SETTINGS
	};
}

export function webSettingsUpdated(settings) {
	return {
		type: Consts.WEB_SETTINGS_UPDATED,
		settings
	};
}

export function fetchUserProfile(onlyProfile) {
	return (dispatch, cb) => {
		dispatch({
			type: Consts.FETCHING_PROFILE
		});
		return Promise.all([profileService.fetchUserProfile(), profileService.getEmrIntegration()]).then((results) => {
			const res = results[0];
			res.data.photoUrl = Utils.getAvatarUrl();
			if (onlyProfile) {
				dispatch(buildFetchProfileSuccessAction(res.data));
			}
			else {
				dispatch(buildFetchProfileSuccessAction(res.data));
				dispatch(fetchContacts(res.data));
			}
			dispatch(buildFetchEmrIntegration(results[1].data.emrIntegration));
			dispatch(fetchContactRequests());

			if (cb) {
				cb();
			}
		}).catch((err) => {
			dispatch(buildFetchProfileFailureAction(err.message));
		});
	}
}

export function changeProfilePicture(data) {
	return (dispatch) => {
		return profileService.changeProfilePicture(data).then((res) => {
			dispatch(setFeedback({
				feedbackType: 'success',
				message: `You've successfully changed your Profile Picture`,
				show: true
			}));
			return Promise.resolve(res);
		}).catch((message) => {
			dispatch(setFeedback({ feedbackType: 'error', message, show: true }));
			return Promise.reject(message);
		});
	}
}

export function updateWebSettings(data) {
	return (dispatch) => {
		return profileService.updateWebSettings(data).then((res) => {
			dispatch(setFeedback({
				feedbackType: 'success',
				message: `You've successfully changed your Web Settings`,
				show: true
			}));
			return Promise.resolve(res);
		}).catch((message) => {
			dispatch(setFeedback({ feedbackType: 'error', message, show: true }));
			return Promise.reject(message);
		});
	}
}

export function changeSecurityInfo({ pin, password, securityQuestion, securityAnswer, privacyEnabled }) {
	return (dispatch) => {
		return profileService.changeSecurityInfo(Object.assign( {},
			pin && { pin },
			password && { password },
			securityQuestion && { securityQuestion },
			securityAnswer && { securityAnswer },
			privacyEnabled && { privacyEnabled }
		)).then((res) => {
			dispatch(setFeedback({
				feedbackType: 'success',
				message: `You've successfully changed your security info`,
				show: true
			}));
			return Promise.resolve(res);
		}).catch((message) => {
			dispatch(setFeedback({
				feedbackType: 'error',
				message,
				show: true
			}));
			return Promise.reject(message);
		});
	};
}

export function changePersonalInfo(data) {
	return (dispatch) => {
		return profileService.changePersonalInfo(data).then((res) => {
			dispatch(setFeedback({
				feedbackType: 'success',
				message: `You've successfully changed your Personal Info`,
				show: true
			}));
			return Promise.resolve(res);
		}).catch((message) => {
			dispatch(setFeedback({ feedbackType: 'error', message, show: true }));
			return Promise.reject(message);
		});
	}
}

export function fetchFlags() {
	return dispatch => {
		return profileService.fetchFlags().then((res) => {
			console.log('fetched flags', res);
			dispatch({
				type: Consts.FETCH_FLAGS_SUCCESS,
				flags: res.data
			});
			return Promise.resolve(res);
		}).catch((err) => {
			alert('An error occurred fetching flags');
			return Promise.reject(err);
		});
	};
}

export function saveFlag(flag, cb = ()=>{}, result) {
	return dispatch => {
		return profileService.saveFlag(flag).then((res) => {
			dispatch({
				type: Consts.SAVE_FLAG_SUCCESS,
				flag: flag
			});
			return Promise.resolve(res);
		}).catch((err) => {
			console.log('error fetching contacts');
			return Promise.reject(err);
		});
	};
}