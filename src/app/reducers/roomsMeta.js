import update from 'immutability-helper';

import * as Consts from '../configs/constants';

// unfortunate workaround for https://phabricator.babeljs.io/T6777
typeof undefined;
const defaultState = {
	filer: null,
	newRoomQueue: []
};

export default function roomsMeta(state = defaultState, action) {
	switch (action.type) {
		case Consts.SET_GROUP_FILTER: {
			return {
				...state,
				filter: action.filter
			}
		}
		case Consts.ADD_NEW_ROOM_QUEUE: {
			return {
				...state,
				newRoomQueue: [...state.newRoomQueue, action.room],
			}
		}

		case Consts.REMOVE_NEW_ROOM_QUEUE: {
			const index = state.newRoomQueue.findIndex(room => room.roomName === action.roomName);
			return index > -1 ? update(state, { newRoomQueue: { $splice: [[index, 1]] } }) : state;
		}
		default: {
			return state;
		}
	}
}
