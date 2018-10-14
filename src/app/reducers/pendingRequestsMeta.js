import * as Consts from '../configs/constants';

const defaultState = {
	tempThread: null
};


export default function pendingRequestsMeta(state = defaultState, action) {
	switch (action.type) {
		case Consts.UPDATE_THREAD:
		case Consts.CHANGE_THREAD:
		case Consts.CREATE_THREAD:
			return defaultState;
			break;
		case Consts.CREATE_TEMP_THREAD: {
			return {
				tempThread: action.tempThread
			};
		}
		case Consts.REMOVE_TEMP_THREAD: {
			return defaultState
		}
		default:
			return state;
	}
}