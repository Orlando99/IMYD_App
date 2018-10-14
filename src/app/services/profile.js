import * as request from 'axios';
import { getRequestUrl, getError } from './../utils/index';
import { setToken, getToken } from './../utils/auth';

export function fetchUserProfile() {
	return request.get(getRequestUrl(`/api/v1/profile`), { headers: { 'x-auth-token': getToken() } } );
}

export function changeProfilePicture(file) {
	const formData = new FormData();
	formData.append('file', file);

	return request.post(getRequestUrl(`/api/v1/profile/photo`), formData, { headers: { 'x-auth-token': getToken() } } ).catch(function(err) {
		let res = err && err.response && err.response.data || {};
		const message = res.message || getError( res.errorCode || res.status);
		return Promise.reject(message);
	});
}

export function getEmrIntegration() {
	return request.get(getRequestUrl(`/api/v1/settings/enabledFeatures`), { headers: { 'x-auth-token': getToken() } } );
}

export function getSecurityInfo() {
	return request.get(getRequestUrl(`/api/v1/profile/security`), { headers: { 'x-auth-token': getToken() } } );
}

export function getWebSettings() {
	return request.get(getRequestUrl(`/api/v1/settings/data`), { headers: { 'x-auth-token': getToken() } } );
}

export function updateWebSettings(data) {
	return request.patch(getRequestUrl(`/api/v1/settings/data`), data, { headers: { 'x-auth-token': getToken() } } ).catch(function(err) {
		let res = err && err.response && err.response.data || {};
		const message = res.message || getError( res.errorCode || res.status);
		return Promise.reject(message);
	});
}

export function changePersonalInfo(data) {
	return request.patch(getRequestUrl(`/api/v1/profile/summary`), data, { headers: { 'x-auth-token': getToken() } } ).catch(function(err) {
		let res = err && err.response && err.response.data || {};
		const message = res.message || getError( res.errorCode || res.status);
		return Promise.reject(message);
	});
}

export function changeSecurityInfo(data = {}) {
	return request.patch(getRequestUrl('/api/v1/profile/security'), data, { headers: {'x-auth-token': getToken() } }).catch(function(err) {
		let res = err && err.response && err.response.data || {};
		const message = res.message || getError( res.errorCode || res.status);
		return Promise.reject(message);
	});
}

export function fetchPracticeTypes(params) {
	return request.get(getRequestUrl(`/api/v1/practiceTypes/search?term=${params.data.query || ''}&page=${params.data.page-1}`), { headers: { 'x-auth-token': getToken() } } );
}

export function fetchHospitals(params) {
	return request.get(getRequestUrl(`/api/v1/hospitals/search?term=${params.data.query || ''}&page=${params.data.page-1}`), { headers: { 'x-auth-token': getToken() } } );
}

export function fetchJobTitles(params) {
	return request.get(getRequestUrl(`/api/v1/jobTitles/search?term=${params.data.query || ''}&page=${params.data.page-1}`), { headers: { 'x-auth-token': getToken() } } );
}

export function fetchDesignations(params) {
	return request.get(getRequestUrl(`/api/v1/designations/search?term=${params.data.query || ''}&page=${params.data.page-1}`), { headers: { 'x-auth-token': getToken() } } );
}

export function fetchFlags() {
	return request.get(getRequestUrl('/api/v1/flags'), { headers: {'x-auth-token': getToken() } });
}

export function saveFlag(flag) {
	return request.put(getRequestUrl(`/api/v1/flags/${flag.flagType}/${flag.value}`), {}, { headers: {'x-auth-token': getToken() } });
}