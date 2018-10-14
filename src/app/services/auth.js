import * as request from 'axios';
import { getRequestUrl } from './../utils/index';
import { setToken, getToken } from './../utils/auth';

export function extendSession() {
	//return request.get(getRequestUrl('/session'));
	return request.get('/session');
}

export function extendToken() {
	return request.post(getRequestUrl('/tokens/imUser/refresh'), getToken()).then((resp) => {
		setToken(resp.data);
	})
}

export function fetchAuthToken(data = {}) {
	return request.post(getRequestUrl('/tokens/imUser/new'), data).then((resp) => {
		setToken(resp.data);
	})
}

export function login({ username, password }) {
	return request.post('/login', `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`);
}

export function logout() {
	return request.post('/logout');
}