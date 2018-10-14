import * as Consts from '../configs/constants';

export function setGroupFilter(filter) {
	return {
		type: Consts.SET_GROUP_FILTER,
		filter
	};
}


