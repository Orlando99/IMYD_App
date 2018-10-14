import cookies from 'my-simple-cookie';
import moment from 'moment';
import momentTimezone from 'moment-timezone';
import * as Consts from '../configs/constants';
import configs from '../configs/configs';
import ERRORS from '../configs/errors';


export function convertRawMessage(rawMessage, currentThreadID) {
	let message = rawMessage.payload;

	return {
		text: message.body,
		type: message.type,
		threadID: message.threadName,
		threadName: message.threadName,
		fromUsername: message.fromUsername,
		timestamp: message.timestamp,
		messageId: message.messageId,
		sender: { username: message.fromUsername },
		// we'll never have messageUid coming from this direction so just set messageId
		messageUid: message.messageId,
		date: new Date(message.timestamp),
		file: message.file,
		fileType: message.fileType,
		filePath: message.filePath
	};
};

export function getCreatedMessageData({ text, fileName, fileSize, fileType, filePath, threadID, user, type }) {
	var timestamp = new Date();
	return {
		messageId: timestamp.getTime().toString(),
		type,
		threadID,
		contact: user,
		file: fileType != null,
		fileName,
		fileSize,
		fileType,
		filePath,
		timestamp,
		text,
		isRead: true,
		currentUser: true,
		fileLoading: fileType != null,
		delivery: {}
	};
};

export function buildThreadID(username1, username2) {
	let threadID = '';

	if (username1 < username2) {
		threadID += username1 + '_' + username2;
	}
	else {
		threadID += username2 + '_' + username1;
	}
	return threadID;
};

export function getMomentFromTimestamp(timestamp) {
	if (timestamp instanceof Date) {
		return moment(timestamp);
	}
	return moment(timestamp, 'YYYY-MM-DD HH:mm:ssZ');
}

export function formatTimestamp(timestamp, includeFromNow, yesterday) {
	if (!timestamp) {
		return '';
	}

	const local = getMomentFromTimestamp(timestamp);
	const now = moment(new Date());
	const diff = now.diff(local);
	let formatted;
	const hourly = local.format('h:mm A');

	if (diff < 30000) {
		formatted = 'Now';
	}
	else if (diff < 3600000 && includeFromNow) {
		formatted = local.fromNow();
	}
	else if (now.startOf('day').diff(local.startOf('day'), 'day') === 0 || !yesterday) {
		formatted = hourly;
	}
	else if (now.startOf('day').diff(local.startOf('day'), 'day') === 1 && yesterday) {
		formatted = 'Yesterday';
	}
	else if (yesterday) {
		formatted = local.format('MM/DD/YYYY');
	}
	return formatted;
};

export function UInt8ArrayToByteArray(array) {
	let output = [];
	for (let i = 0, len = array.length; i < len; i++) {
		const byte = array[i];
		output.push(byte);
	}

	return output;
};

export function translatePhotoUrl(photoUrl) {
	if (photoUrl && photoUrl.indexOf('imyourdoc.com') !== -1 && photoUrl.indexOf('blob') !== 0) {
		photoUrl = photoUrl.replace(/^.*imyourdoc\.com/, location.protocol + '//' + location.host);
	}
	if (photoUrl && photoUrl.indexOf('blob') !== 0) {
		if (photoUrl.indexOf('?') === -1) {
			photoUrl = photoUrl + '?x-auth-token=' + currentAuthToken;
		}
		else {
			photoUrl = photoUrl + '&x-auth-token=' + currentAuthToken;
		}
	}
	return photoUrl;
};

export function translatePhoneNumber(phone) {
	if (phone && phone.indexOf('-') === -1) {
		return phone.replace(/\d*(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
	}
	return phone;
};

export function pageIsHidden() {
	let hidden;
	if (typeof document.hidden !== 'undefined') {
		hidden = 'hidden';
	}
	else if (typeof document.mozHidden !== 'undefined') {
		hidden = 'mozHidden';
	}
	else if (typeof document.msHidden !== 'undefined') {
		hidden = 'msHidden';
	}
	else if (typeof document.webkitHidden !== 'undefined') {
		hidden = 'webkitHidden';
	}
	return !!document[hidden] || !document.hasFocus();
};

// https://davidwalsh.name/javascript-debounce-function
export function debounce(func, wait, immediate) {
	var timeout;
	return function () {
		let context = this;
		let args = arguments;

		let later = function () {
			timeout = null;
			if (!immediate) {
				func.apply(context, args);
			}
		};
		let callNow = immediate && !timeout;
		clearTimeout(timeout);
		timeout = setTimeout(later, wait);
		if (callNow) {
			 func.apply(context, args);
		}
	};
}

export function firstLogin(flags) {
	return flags && ((flags.some((flag) => {
		return flag.flagType === 'TERMS_ACCEPTED' && !flag.value;
	}) || flags.some((flag) => {
		return flag.flagType === 'CONFIG_REQUIRED' && flag.value;
	})));
}

export function needsTerms(flags) {
	return flags && (flags.some((flag) => {
		return flag.flagType === 'TERMS_ACCEPTED' && !flag.value;
	}));
}

export function needsSecurity(flags) {
	return flags && (flags.some((flag) => {
		return flag.flagType === 'CONFIG_REQUIRED' && flag.value;
	}));
}

export function getError(status) {
	return ERRORS[status] || ERRORS[0];
}

export function checkNodeVisibility(node) {
  var top = node.offsetTop;
  var left = node.offsetLeft;
  var width = node.offsetWidth;
  var height = node.offsetHeight;

  while(node.offsetParent) {
    node = node.offsetParent;
    top += node.offsetTop;
    left += node.offsetLeft;
  }

  return (
    top >= window.pageYOffset &&
    left >= window.pageXOffset &&
    (top + height) <= (window.pageYOffset + window.innerHeight) &&
    (left + width) <= (window.pageXOffset + window.innerWidth)
  );
}

export function getRequestUrl(uri){
	switch(true){
		// ToDo: Remove this uri reference after we refactor all image/file downloads in all device types
		case uri.indexOf('/uploads') === 0 || uri.indexOf('/profilepic') === 0:
			return configs.imageUrl + uri;
			break;
		case uri.indexOf('/tokens') === 0:
			return configs.authUrl + uri;
			break;
		case uri.indexOf('/login') === 0 || uri.indexOf('/logout') === 0 || uri.indexOf('/session') === 0:
			return configs.socketUrl + uri;
			break;
		case uri.indexOf('/api/') === 0:
			return configs.apiUrl + uri;
			break;
		default:
			return uri;
	}
}

export function getAvatarUrl(){
	return getRequestUrl(`/api/v1/profile/photo?cache-buster=${Date.now()}`);
}

export function hasAvatar(user){
	if ( user && user.photoUrl ) return user.username || false;
	return false;
}

export function getContactAvatarUrl(username){
	if ( !username ) return false;
	return getRequestUrl(`/api/v1/contacts/${username}/photo`);
}

export function minToMilliSec(minutes){
	return Consts.ONE_MINUTE * minutes;
}

export function minToSec(minutes){
	return 60 * minutes;
}