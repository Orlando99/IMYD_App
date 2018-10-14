import * as Consts from '../configs/constants';

// unfortunate workaround for https://phabricator.babeljs.io/T6777
typeof undefined;

export default function audioNotification(state = {}, action) {

	switch (action.type) {
		case Consts.RESET_AUDIO_NOTIFICATION:
			return { audioStatus: action.type };
			break;
		case Consts.PLAY_AUDIO_NOTIFICATION:
			return { audioStatus: action.type };
			break;
		case Consts.PAUSE_AUDIO_NOTIFICATION:
			return { audioStatus: action.type };
			break;
		default: {
			return state;
		}
	}
}
