import cookies from 'my-simple-cookie';
import configs from '../configs/configs';
import { minToSec } from './index';
import { getStoreState } from './store';

export function setToken(token) {
	cookies.set('x-auth-token', token, { expires: minToSec(configs.tokenTimeout + 10), domain: `.${ configs.domain }` });
}

export function getToken() {
	return cookies.get('x-auth-token');
}

export function removeToken() {
	cookies.remove('x-auth-token', { domain: `.${ configs.domain }` });
}

export function getUser() {
	const storeState = getStoreState();
	if (storeState.auth && storeState.auth.user) {
		return storeState.auth.user
	}
	return false;
}