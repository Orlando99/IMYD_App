import { getStoreState } from './store';
import * as Consts from '../configs/constants';

export function prepareSentExternalRequests(requests, hospitals) {
	requests = Array.isArray(requests) ? requests : [ requests ];
	requests = requests.map((request, key) => {
		request.contact = {};
		request.contact.name = request.inviteeFirstName + ' ' + request.inviteeLastName;
		request.contact.userType =  request.inviteePatient ? Consts.PATIENT : Consts.STAFF;
		if( request.hospitalId ) {
			request.contact.hospitals = hospitals.filter((hospital, key)=> {
				return hospital.id.toString() == request.hospitalId;
			});
		}
		return request;
	});
	return requests;
}

export function getContacts() {
	const storeState = getStoreState();
	return storeState.contacts || false;
}

export function getContactsMeta() {
	const storeState = getStoreState();
	return storeState.contactsMeta || false;
}