import update from 'immutability-helper';

import * as Consts from '../configs/constants';

// unfortunate workaround for https://phabricator.babeljs.io/T6777
typeof undefined;

export default function rooms(state = [], action) {
	switch (action.type) {
		case Consts.FETCH_ROOMS_SUCCESS: {
			return action.rooms;
		}
		case Consts.RENAME_ROOM: {
			const roomIndex = state.findIndex(room => room.name === action.threadID);

			return roomIndex > -1 ? update(state, { [roomIndex]: {
				$merge: { naturalName: action.roomNaturalName },
			}}) : state;
		}
		case Consts.REMOVE_ROOM: {
			const roomIndex = state.findIndex(room => room.name === action.roomName);
			return roomIndex > -1 ? update(state, { $splice: [[roomIndex, 1]] }) : state;
		}

		case Consts.DELETE_FROM_ROOM: {
			const roomIndex = state.findIndex(room => room.name === action.roomName);
			if (roomIndex > -1) {
				const userIndex = (state[roomIndex].users || []).findIndex(user =>
					user.username == action.username);
				if( userIndex >= 0 ) {
					update(state, { [roomIndex]: { users: { $splice: [[userIndex, 1]] } } });
				}
			}
			return state;
		}
		default: {
			return state;
		}
	}
}
