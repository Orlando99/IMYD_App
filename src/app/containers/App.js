import React from 'react';
import { connect } from 'react-redux'
import qs from 'qs';
import _ from 'lodash';
import update from 'immutability-helper';

import Header from '../components/Header';
import NavigationPane from '../components/NavigationPane';
import Feedback from '../components/Feedback';
import ContextMenu from '../components/ContextMenu';
import AudioNotification from '../components/AudioNotification';
import Chat from '../components/Chat';
import Login from '../components/Login';
import ExternalPage from '../components/ExternalPage.js';
import ExternalAccept from '../components/ExternalAccept';
import { clearSearch } from '../actions/search';
import * as profileAction from '../actions/profile';
import * as profileService from '../services/profile';
import * as roomsAction from '../actions/rooms';
import * as roomsUtils from '../utils/rooms';
import * as messagesAction from '../actions/messages';
import * as threadsAction from '../actions/threads';
import * as contactsAction from '../actions/contacts';
import * as generalAction from '../actions/general';
import * as authAction from '../actions/auth';
import * as outgoing from '../lib/webSocket/outgoing';
import * as Utils from '../utils/index';
import * as fileUtils from '../utils/file';
import * as Consts from '../configs/constants';
import * as timer from '../lib/timer/index';
import * as idleTimer from '../lib/timer/idleTimer';
import * as notifications from '../lib/notifications';

// unfortunate workaround for https://phabricator.babeljs.io/T6777
typeof undefined;

class App extends React.Component {
	constructor(props) {
		super(props);
		props.dispatch(authAction.ping());

		this.settingFatched = false;
		// const sub = { x: 1, y: 2, z: [1, 2] };
		// const a = [{a: '1', b: sub}, {a: '2', b: 'b'}];
		// const b = _.cloneDeep(a);
		// console.log('immutability check: ', update(sub, { $unset: ['x'], $merge: { z: [3] } }));
	}

	componentDidUpdate() {
		const { dispatch, threads, auth: { user, authenticated } } = this.props;

		if ( !this.settingFatched && authenticated) {
			profileService.getWebSettings().then((res) => {
				const data = res ? (res.data || {}) : {};
				notifications.setNotificationSettings( data.enableSoundNotification );
				idleTimer.setTimeout( data.timeoutInMins );
			});

			this.settingFatched = true;
		}

		if ( authenticated) {
			threads.forEach(thread => {
				if (thread.needsMessageFetch) {
					delete thread.needsMessageFetch;
					if (thread.type === Consts.ROOM) {
						dispatch(roomsAction.fetchRooms());
						dispatch(roomsAction.fetchUsersForRoom(thread.name));
						dispatch(messagesAction.fetchMessagesForRoom(thread.name, 0, Consts.PAGE_SIZE, user));
					}
					else {
						dispatch(messagesAction.fetchMessages(thread.id, thread.participants[0].username,
							user.username, 0, Consts.PAGE_SIZE, user));
					}
				}
				else if (thread.needsUsersFetched) {
					delete thread.needsUsersFetched;
					dispatch(roomsAction.fetchUsersForRoom(thread.name));
				}
			});
		}
	}

	render() {
		const { auth: { flags, authenticated, loginError, user, fetchingProfile, fetchingToken, justLoggedIn },
      threadMeta: { more, doneFetching }, pendingRequestsMeta: { tempThread }, pendingRequests, dispatch, threads, contacts,
      currentThreadID,  rooms, search } = this.props;
		const currentThread = threads.find(thread => thread.id == currentThreadID) ||
			threads[0] || {};

		let content;
		if (authenticated) {
			timer.start(dispatch);

      content = (
				<div>
					<Feedback />
					<ContextMenu/>
					<AudioNotification src="/audio/incomingMessage.mp3"/>
					<Header
						user={user}
						flags={flags}
						dispatch={dispatch}
						logout={() => dispatch(authAction.postLogOut())}
						onSecurityChange={(flag) => {

							flags.find((flag) => flag.flagType === 'CONFIG_REQUIRED').value = flag.value;

							this.setState({ auth: {
								authenticated,
								loginError,
								fetchingProfile,
								user: (this.state || this.props).auth.user,
								flags: flags
							}});
						}}
						updateContacts={() => {
							dispatch(contactsAction.fetchContacts(user));
						}}
						onSettingsSaveSuccess={(user) => {
							this.setState({ auth: {
								authenticated,
								loginError,
								fetchingProfile,
								user: user,
								flags: (this.state || this.props).auth.flags
							}});
						}}
						onAcceptTOS={(flag, cb) => {

							dispatch(profileAction.saveFlag(flag))
								.then(() => { cb() })
								.catch((err) => { cb(err) });

							flags.find((flag) => flag.flagType === 'TERMS_ACCEPTED').value = flag.value;

							this.setState({ auth: {
								authenticated,
								loginError,
								fetchingProfile,
								user: (this.state || this.props).auth.user,
								flags: flags
							}});
						}} />
					<NavigationPane
						rooms={rooms}
						threads={threads}
						user={user}
						onThreadChange={ ( threadID, room ) => {

							if (search.jumpToMessageID) {
								dispatch(clearSearch(search.threadID));
							}

							if (room) {
								const found = threads.find( (thread) => { return thread.id === room.name });
								if (!found) {
									const participants = room.users.filter((roomUser) => { return roomUser.username !== user.username });
									return dispatch(threadsAction.postNewThread(room.name, participants, room.naturalName, Consts.ROOM));
								} else if( !threadID ) {
									threadID = found.id;
								}
							}

							return dispatch(threadsAction.postChangeThread(threadID));
						}}
						onRemoveThread={threadID => {

							if (search.jumpToMessageID) {
								dispatch(clearSearch(search.threadID));
							}
							return threadsAction.postRemoveThread(threadID)(dispatch);
						}}
						onNewThread={(participants, roomNaturalName, forceRoom) => {
							if (search.jumpToMessageID) {
								dispatch(clearSearch(search.threadID));
							}

							if (participants.length > 1 || forceRoom) {// && !found) {
								return dispatch(roomsUtils.createNewRoom({ user, participants, roomNaturalName }))
							}
							else {
								const threadID = Utils.buildThreadID(participants[0].username, user.username);
								return dispatch(threadsAction.postNewThread(threadID, participants, roomNaturalName));
							}
						}}
						onUpdateThread={(threadID, participants, roomNaturalName) => {
							if (participants.length === 0) {
								return reject(false);
							}

							const found = threads.find(thread => thread.id === threadID);

							if (!found) {
								return false;
							}

							if (found.participants.length > participants.length) {
								found.participants.forEach((oldUser) => {
									let oldUserDeleted = true;
									participants.forEach((newUser) => {
										if( oldUser.username === newUser.username) {
											oldUserDeleted = false;
											return true;
										}
									});
									if ( oldUserDeleted ) {
										// for lack of better notification we use a hack
										let messageID = JSON.stringify({
													type: 'deleteFromRoom',
													payload: {
														username: oldUser.username,
														roomName: found.id,
														messageUid: Date.now()
													}
												});
										outgoing.deleteFromRoom(oldUser.username, found.id, messageID);
									}
								});
							}

							if (found.naturalName !== roomNaturalName) {
								outgoing.renameRoom(found.id, roomNaturalName);
							}

							roomNaturalName = roomNaturalName || roomsUtils.createRoomNaturalName(participants);
							if (found.type === Consts.ONE_TO_ONE && participants.length > 1) {
								return dispatch(roomsUtils.createNewRoom({ user, participants, roomNaturalName }))
							}
							else {
								participants.forEach((user) => {
									if (user.username && !found.participants.find((currentUser) => currentUser.username === user.username)) {
										outgoing.createRoomInvitation(threadID, user.username, (new Date()).getTime().toString());
									}
								});

								return dispatch(threadsAction.postUpdateThread(threadID, participants));
							}
						}}
						onContactChange={contactId => {

						}}
						contacts={contacts}
						pendingRequests={pendingRequests}
						currentThreadID={currentThreadID}
						fetchNewThreadPage={(page) => {
							return dispatch(threadsAction.fetchThreads(user, page));
						}}
						moreThreads={more}
						doneFetching={doneFetching}
          />
					<Chat
						search={search}
						rooms={rooms}
						justLoggedIn={justLoggedIn}
						contacts={contacts}
						dispatch={dispatch}
						newAvatar={!!threads.newAvatar}
						participants={currentThread.participants}
						totalMessages={currentThread.messages ? currentThread.messages.length : 0}
						messages={currentThread.messages}
						addMessage={msg => {
							if (!msg.threadID) {
								alert('You must first select a thread before sending a message');
								return;
							}
							let to;

							if (currentThread.type === Consts.ROOM) {
								to = currentThread.name;
							}
							else {
								to = msg.threadID.split('_').find(part => {
									return part !== 'thread' && part !== user.username;
								});
							}

							const formattedMessage = Utils.getCreatedMessageData({
								text: msg.text,
								fileName: null, fileType: null, filePath: null,
								threadID: msg.threadID,
								user,
								type: currentThread.type,
							});

							dispatch(messagesAction.postNewMessage(formattedMessage));

							outgoing.sendMessage(formattedMessage, to, currentThread.type);
						}}
						addFile={(file, bytes, threadID) => {
							if (!threadID) {
								alert('You must first select a thread before sending a message');
								return;
							}
							let to;

							if (currentThread.type === Consts.ROOM) {
								to = currentThread.name;
							}
							else {
								to = threadID.split('_').find(part => {
									return part !== 'thread' && part !== user.username;
								});
							}
							const fileName = file.name.replace(/(\.\w+$)/, '');
							const fileSize = file.size;
							const mimeType = file.type;
							const fileExtension = file.name.split('.').pop();
							const filePath = window.URL.createObjectURL(file);
							const fileType = fileUtils.getFileType(fileExtension);

							const formattedMessage = Utils.getCreatedMessageData({
								text: null,
								fileName, fileType, filePath, fileSize,
								threadID, user, type: currentThread.type,
							});
							dispatch(messagesAction.postNewMessage(formattedMessage));

							outgoing.sendAttachment(formattedMessage.messageId, to, fileName, fileExtension, mimeType, bytes, currentThread.type);
						}}
						user={user}
						threadID={currentThread.id}
						thread={currentThread}
						tempThread={tempThread}
						typing={currentThread.typing}
						inputBuffer={currentThread.inputBuffer}
						onTypeStart={() => {
							let to;
							if (currentThread.type === Consts.ROOM) {
								to = currentThread.name;
							}
							else {
								to = currentThread.participants && currentThread.participants[0].username;
							}
							outgoing.sendComposing(to, currentThread.type);
						}}
						onTypeStop={ (thread) => {
							let to;
							let activeThread = thread || currentThread;
							if (activeThread.type === Consts.ROOM) {
								to = activeThread.name;
							}
							else {
								to = activeThread.participants && activeThread.participants.length && activeThread.participants[0].username;
							}

							if( to && activeThread.type ) {
								outgoing.pauseComposing(to, activeThread.type);
							}

						}}
						scrollTop={currentThread.scrollTop}
						unreadCount={currentThread.unreadCount}
						page={currentThread.page}
						pageSize={currentThread.pageSize}
						last={currentThread.last}
						fetching={currentThread.fetching}
						messageStateChanged={currentThread.messageStateChanged}
						messageIsRead={msg => {
							outgoing.setReadStatus(msg.messageId || msg.messageUid, msg.contact.username);
							return dispatch(messagesAction.postMessageRead(msg));
						}}
						fetchNewPage={(page, pageSize) => {
							if (currentThread.type === Consts.ROOM) {
								return dispatch(messagesAction.fetchMessagesForRoom(currentThread.name, page, pageSize, user));
							}
							else {
								let toUsername = currentThread.id.split('_').find(part => {
									return part !== 'thread' && part !== user.username;
								});
								console.log('fetching new page: ', currentThread.id, toUsername, user.username);
								return dispatch(messagesAction.fetchMessages(currentThread.id, toUsername, user.username, page, pageSize, user));
							}
						}}
						scrollChanged={(scrollTop, threadID) => {
							return generalAction.postNewScrollPosition(scrollTop, threadID)(dispatch);
						}}
						resendMessage={(msg) => {
							let to;

							if (currentThread.type === Consts.ROOM) {
								to = currentThread.name;
							}
							else {
								to = msg.threadID.split('_').find(part => {
									return part !== 'thread' && part !== user.username;
								});
							}
							outgoing.sendMessage(msg, to, currentThread.type);
						}} />
				</div>
			);
		}
		else if (fetchingProfile || fetchingToken) {
			// TODO: make this look nicer
			content = <div>Establishing a connection with the server ...</div>;
		}
		else {

			let query = qs.parse(location.search.replace(/^\?/, ''));
			if ( query.token ) {
				content = (
					<ExternalPage >
						<ExternalAccept dispatch={dispatch} token={query.token} error={loginError}/>
					</ExternalPage>
				);
			} else {
				content = (
					<ExternalPage >
						<Login dispatch={dispatch} error={loginError} loginPage="true" />
					</ExternalPage>
				);
			}

		}
		return content;
	}
}

function select(state = {}) {
  return {
		threads: state.threads,
		contacts: state.contacts,
		pendingRequests: state.pendingRequests,
		currentThreadID: state.currentThreadID,
		auth: state.auth,
    pendingRequestsMeta: state.pendingRequestsMeta,
		feedback: state.feedback,
		threadMeta: state.threadMeta,
		rooms: state.rooms,
		search: state.search
	};
}

export default connect(select)(App)
