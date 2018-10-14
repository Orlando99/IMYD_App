import React, { PropTypes, Component } from 'react';
import * as Consts from '../configs/constants'
import ForwardMessageContacts from './ForwardMessageContacts';
import * as Utils from '../utils/index';
import $ from 'jquery';
import { getStore } from '../utils/store';
import { setFeedback } from '../actions/general';
import { postNewMessage } from '../actions/messages';
import { postNewThread } from '../actions/threads';
import { sendMessage, forwardAttachment } from '../lib/webSocket/outgoing';
import { setContextMenu } from '../actions/contextMenu';

export default class ForwardMessage extends Component {
	constructor(props) {
		super(props);
		this.state = {
			...props,
			contacts: JSON.parse(JSON.stringify(this.props.contacts)),
			rooms: JSON.parse(JSON.stringify(this.props.rooms))
		};
	}

	selectRoom(roomId) {
		const rooms = this.state.rooms.slice();
		const room = rooms.find((contact) => {
			return contact.name == roomId;
		});

		if (room) {
			room.selected = !room.selected;
		}

		this.setState({ rooms });
	}

	selectContact(username) {
		const contacts = this.state.contacts.slice();
		const contact = contacts.find((contact) => {
			return contact.username == username;
		});

		if (contact) {
			contact.selected = !contact.selected;
		}

		this.setState({ contacts });
	}

	forwardMessage({ msg, participants, to, threadType }) {
		const message = this.props.message;
		const store = getStore();
		const user = this.props.user;
		store.dispatch(postNewThread(msg.threadID, participants, msg.threadID, threadType));
		const formattedMessage = Utils.getCreatedMessageData({
			text: msg.text,
			fileName: message.fileName || null,
			fileType: message.fileType || null,
			filePath: message.filePath || null,
			threadID: msg.threadID,
			user,
			type: threadType
		});
		store.dispatch(postNewMessage(formattedMessage));

		if ( message.file ) {
			forwardAttachment({
				messageId: message.messageId,
				messageUid: formattedMessage.messageId,
				to,
				type: threadType
			})
		}
		else {
			sendMessage(formattedMessage, to, threadType);
		}

		return msg;
	}


	forwardMessageToRoom(room) {
		if (!room || !room.name) {
			return false;
		}

		const user = this.props.user;
		const participants = room.users.filter((roomUser) => {
			return user.username !== roomUser.username;
		});

		const to = room.name;
		const msg = { text: this.props.message.text, threadID: room.name };

		// don't forward to same thread
		if ( this.props.message.threadID === msg.threadID ) {
			return { room, msg, success: false}
		}

		this.forwardMessage({ msg, participants, to, threadType: Consts.ROOM });
		return { room, msg, success: true}
	}

	forwardMessageToContact(contact) {
		if (!contact || !contact.username) {
			return false;
		}

		const participants = [ contact ];
		const user = this.props.user;
		const to = contact.username;
		const msg = {
			text: this.props.message.text,
			threadID: Utils.buildThreadID(contact.username, user.username)
		};

		// don't forward to same thread
		if ( this.props.message.threadID === msg.threadID ) {
			return { contact, msg, success: false}
		}

		this.forwardMessage({ msg, participants, to, threadType: Consts.ONE_TO_ONE});
		return { contact, msg, success: true}
	}

	handleForwardClick(e) {
		const store = getStore();
		const { rooms, contacts } = this.state;

		let selectedRooms = rooms.filter((room) => {
			return room.selected;
		});

		let selectedContacts = contacts.filter((contact) => {
			return contact.selected;
		});

		if ( !(selectedRooms.length + selectedContacts.length) ) {
			store.dispatch(setFeedback({ feedbackType: 'error', message: 'No contact were selected.', show: true }));
			return;
		}

		selectedRooms = selectedRooms.map(this.forwardMessageToRoom.bind(this));
		selectedContacts = selectedContacts.map(this.forwardMessageToContact.bind(this));
		const errorRoom = selectedRooms.find((room)=> { return !room.success });
		const errorContact = selectedContacts.find((contact)=> { return !contact.success });

		if ((selectedRooms.length + selectedContacts.length) > 1 && (errorRoom || errorContact)) {
			store.dispatch(setFeedback({ feedbackType: 'warning', message: 'You cannot forward a message to the same contact, Your message has been forwarded to other selected contacts ', show: true }));
			return this.props.closeModelWindow();
		}
		else if(errorRoom || errorContact) {
			store.dispatch(setFeedback({ feedbackType: 'error', message: 'You cannot forward a message to the same contact.', show: true }));
			return;
		}

		store.dispatch(setFeedback({ feedbackType: 'success', message: 'Your message has been forwarded.', show: true }));
		return this.props.closeModelWindow();
	}

	render() {
		const { user, contacts, rooms } = this.state;

		return (
			<div className="container">
				<ForwardMessageContacts
					user={user}
					contacts={contacts}
					rooms={rooms}
					onNewThread={(participants) => {
						this.selectContact(participants[0].username);
					}}
					onThreadChange={(roomId) => {
						this.selectRoom(roomId);
					}} />

				<button
					style={{width: '180px', left: 'calc(50% - 90px)'}}
					className="create"
					onClick={(e) => { this.handleForwardClick(e) } }>
					Forward Message
				</button>
			</div>
		);
	}
}
