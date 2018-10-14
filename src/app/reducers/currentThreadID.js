import * as Consts from '../configs/constants';

export default function currentThreadID(state = -1, action) {
	switch (action.type) {
		case Consts.UPDATE_THREAD:
		case Consts.CHANGE_THREAD:
		case Consts.CREATE_THREAD: {
			return action.threadID;
		}

		case Consts.REMOVE_THREAD: {

		}

		case Consts.LOGOUT: {
			return -1;
		}

		default:
			return state;
	}
}
