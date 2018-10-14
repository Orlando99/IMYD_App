import * as Consts from '../configs/constants';

// unfortunate workaround for https://phabricator.babeljs.io/T6777
typeof undefined;

export default function webNotification(state = {}, action) {

	switch (action.type) {
		case Consts.WEB_SETTINGS_UPDATED:
			return Object.assign({}, state, action.settings, {
				webNotificationStatus: action.type,
				message: null
			});
			break;
		case Consts.NEW_NOTIFICATION:
			return Object.assign({}, state, {
				webNotificationStatus: action.type,
				message: action.message
			});
			break;
		case Consts.RESET_NOTIFICATION:
			return Object.assign({}, state, {
				webNotificationStatus: action.type,
				message: null
			});
			break;
		default: {
			return state;
		}
	}
}