import { combineReducers } from 'redux';
import feedback from './feedback';
import contextMenu from './contextMenu';
import audioNotification from './audioNotification';
import webNotification from './webNotification';
import auth from './auth';
import currentThreadID from './currentThreadID';
import threads from './threads';
import chat from './chat';
import contacts from './contacts';
import pendingRequests from './pendingRequests';
import pendingRequestsMeta from './pendingRequestsMeta';
import threadMeta from './threadMeta';
import rooms from './rooms';
import roomsMeta from './roomsMeta';
import search from './search';
import webSocket from './webSocket';

export default combineReducers({
	feedback,
	contextMenu,
	audioNotification,
	webNotification,
	auth,
	contacts,
	pendingRequests,
	pendingRequestsMeta,
	threads,
	chat,
	currentThreadID,
	threadMeta,
	rooms,
	roomsMeta,
	search,
	webSocket
});
