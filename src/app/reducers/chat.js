import * as Consts from '../configs/constants';

// unfortunate workaround for https://phabricator.babeljs.io/T6777
typeof undefined;

export default function chat(state = {}, action) {

	switch (action.type) {
		case Consts.PING_CURRENT_TIME:
			return {  currentTime: action.currentTime };
			break;
		default: {
			return state;
		}
	}
}

