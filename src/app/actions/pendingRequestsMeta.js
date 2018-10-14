import * as Consts from '../configs/constants';

export function createTempThread(tempThread) {
	return {
		type: Consts.CREATE_TEMP_THREAD,
		tempThread
	};
}

export function removeTempThread(requestType, request) {
	return {
		type: Consts.REMOVE_TEMP_THREAD
	};
}