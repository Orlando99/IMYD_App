import * as Consts from '../configs/constants';
import * as roomsService from './../services/rooms';

export function invitedToRoomAction(room) {
	return {
		type: Consts.INVITED_TO_ROOM,
		room
	};
}

export function roomJoinAction({ roomName, username  }) {
	return {
		type: Consts.ROOM_JOIN,
		roomName,
		username
	};
}

export function roomLeaveAction({ roomName, username  }) {
	return {
		type: Consts.ROOM_LEAVE,
		roomName,
		username
	};
}

export function fetchRoomsSuccessAction(rooms) {
	return {
		type: Consts.FETCH_ROOMS_SUCCESS,
		rooms
	};
}

export function removeRoomAction(roomName) {
	return {
		type: Consts.REMOVE_ROOM,
		roomName
	};
}

export function fetchRoomsFailAction(error) {
	return {
		type: Consts.FETCH_ROOMS_FAILURE,
		error
	};
}

export function fetchRooms() {
	return (dispatch) => {
		return roomsService.fetchRooms().then((resp) => {
			if(resp && resp.data && resp.data) {
				dispatch(fetchRoomsSuccessAction(resp.data));
			}
		}).catch((err) => {
			dispatch(fetchRoomsFailAction(err));
		});
	}
}

export function fetchUsersForRoom(name) {
	return (dispatch) => {
		return roomsService.fetchUsersForRoom(name).then((res) => {
			dispatch({
				type: Consts.FETCH_USERS_FOR_ROOM,
				users: res.data,
				roomName: name
			});
		}).catch((err) => {
			console.log('error fetching rooms users');
			dispatch({
				type: Consts.FETCH_USERS_FOR_ROOM,
				disable: true,
				roomName: name
			});
		});
	};
}

export function renameRoom(threadID, roomNaturalName) {
	return dispatch => {
		dispatch({
			type: Consts.RENAME_ROOM,
			threadID,
			roomNaturalName
		});
	}
}

export function addNewRoomQueue(room) {
	return {
		type: Consts.ADD_NEW_ROOM_QUEUE,
		room
	};
}

export function RemoveNewRoomQueue(roomName) {
	return {
		type: Consts.REMOVE_NEW_ROOM_QUEUE,
		roomName
	};
}

export function deleteFromRoom(roomName, userName) {
	return {
		type: Consts.DELETE_FROM_ROOM,
		roomName, 
		userName
	};
}
