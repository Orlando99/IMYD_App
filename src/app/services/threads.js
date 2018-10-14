import * as request from 'axios';
import { getRequestUrl } from './../utils/index';
import { setToken, getToken } from './../utils/auth';

export function fetchThread(threadName) {
	return request.get(getRequestUrl(`/api/v1/communication/threads/room/${threadName}`), { headers: { 'x-auth-token': getToken() } } );
}

export function fetchThreads(page, pageSize) {
	return request.get(getRequestUrl(`/api/v1/communication/threads?page=${page}&size=${pageSize}`), { headers: { 'x-auth-token': getToken() } } );
}