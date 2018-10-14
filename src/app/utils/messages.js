import _ from 'lodash';
import { usersToParticipants } from './array'
import { getMomentFromTimestamp } from './index';

export function calcUploadTime(sizeInBytes) {
	const averageUploadSpeedInBytes = Math.ceil(50 * 1024);

	return sizeInBytes >= averageUploadSpeedInBytes
		? (Math.ceil( sizeInBytes / averageUploadSpeedInBytes ) + 5) * 1000
		: 5000;
}

export function addStatus(message, status) {
	const newMessage = _.cloneDeep(message);
	const users = newMessage.participants || usersToParticipants(newMessage.users) || [];
	newMessage.delivery = newMessage.delivery || {};
	newMessage.delivery[status] = (newMessage.delivery[status] || [])
		.concat(users.map(u => ({ username: u.username })));
	return newMessage;
}

export function sortMessages(a, b) {
	let aTime = getMomentFromTimestamp(a.timestamp);
	let bTime = getMomentFromTimestamp(b.timestamp);

	if (aTime.diff(bTime) < 0) {
		return -1;
	}
	else if (aTime.diff(bTime) > 0) {
		return 1;
	}
	return 0;
}