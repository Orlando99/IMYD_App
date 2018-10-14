import * as request from 'axios';
import { getRequestUrl } from './../utils/index';
import { setToken, getToken } from './../utils/auth';

export function fetchRooms() {
	return request.get(getRequestUrl(`/api/v1/rooms`), { headers: { 'x-auth-token': getToken() } } );
}

export function fetchUsersForRoom(roomName) {
	return request.get(getRequestUrl(`/api/v1/rooms/${roomName}/users`), { headers: { 'x-auth-token': getToken() } } );
}