import { setDeliveredStatus, createRoomInvitation } from './outgoing';
import * as generalAction from '../../actions/general';
import * as threadsAction from '../../actions/threads';
import * as messagesAction from '../../actions/messages';
import * as contactsAction from '../../actions/contacts';
import * as roomsAction from '../../actions/rooms';
import { postLogOut } from '../../actions/auth';
import * as Utils from '../../utils/index';
import * as auth from '../../utils/auth';
import * as roomsUtils from '../../utils/rooms';
import { getContacts, getContactsMeta } from '../../utils/contacts';
import { getThreads } from '../../utils/threads';
import * as Consts from '../../configs/constants';
import * as contactsService from '../../services/contacts';
import { disconnectMessage } from '../../utils/dom';
import { getStore } from '../../utils/store';

let messageStatusTimers = {};

export function DISCONNECTED() {
  disconnectMessage.show('We seem to be having a problem with your connection, reconnecting...');
}

export function RECONNECTED() {
  disconnectMessage.hide();
}

export function RECEIVE_MESSAGE(message) {
  const { dispatch } = getStore();
  let rawMessage;

  if (typeof message !== 'string') {
    return;
  }

  try {
    rawMessage = JSON.parse(message);
  } catch(e) {
    console.log('Unable to parse message: ', message);
  }

  console.log('Received Message: ', rawMessage);

  if (rawMessage.type === 'MessageOutboundMessage') {
    console.log('sending received message to screen');

    let msg = rawMessage.payload;
    const roomName = msg.threadName;
    if(msg.messageId === 'IMYOURDOC_DELETE') {
      dispatch(roomsAction.removeRoomAction(roomName));
      dispatch(threadsAction.removeThreadAction(roomName));
      dispatch(generalAction.setFeedback({
        feedbackType: 'success',
        message: 'This group has been deleted by group admin.',
        show: true
      }));
      return;
    }

    if(msg.messageId === 'iPhoneForCloseAndDelete' || msg.messageId === 'IMYOURDOC_CLOSE') {
      const contacts = getContacts();
      const contact = contacts.find((contact) => {
        return msg.fromUsername === contact.username;
      });
      let username = msg.fromUsername;
      if (contact && contact.name) {
        username = contact.name;
      }
      dispatch(threadsAction.removeThreadAction(roomName));
      dispatch(generalAction.setFeedback({
        feedbackType: 'success',
        message: `${username} has closed your private conversation. You will need to start a new conversation to continue messaging.`,
        show: true
      }));
      return;
    }

    var convertedMessage = Utils.convertRawMessage(rawMessage);
    dispatch(messagesAction.receiveNewMessage(convertedMessage));

    setDeliveredStatus({
      messageId: convertedMessage.messageId,
      toUsername: convertedMessage.fromUsername,
      messageUid: convertedMessage.messageUid
    });
  }
  else if (rawMessage.type === 'ChatStateOutboundMessage') {
    if (rawMessage.payload.fromUsername.toLowerCase() !== 'imyourdoc.com') {
      let { threadName, state, fromUsername } = rawMessage.payload;
      let timerName = fromUsername + '_' + threadName;
      console.log('received chat state message');
      if (state.toLowerCase() === 'composing') {
        console.log('received composing message');
        console.log('messageStatusTimers[timerName]', messageStatusTimers[timerName]);

        if (messageStatusTimers[timerName]) {
          clearTimeout(messageStatusTimers[timerName]);
          messageStatusTimers[timerName] = null;
          delete messageStatusTimers[timerName];
        }

        messageStatusTimers[timerName] = setTimeout(() => {
          clearTimeout(messageStatusTimers[timerName]);
          messageStatusTimers[timerName] = null;
          delete messageStatusTimers[timerName];
          dispatch(generalAction.receiveStoppedTyping(fromUsername, threadName));
        }, 15000);
        dispatch(generalAction.receiveIsTyping(fromUsername, threadName));
      }

      if (state.toLowerCase() === 'paused') {
        if (messageStatusTimers[timerName]) {
          clearTimeout(messageStatusTimers[timerName]);
          messageStatusTimers[timerName] = null;
          delete messageStatusTimers[timerName];
        }
        dispatch(generalAction.receiveStoppedTyping(fromUsername, threadName));
      }
    }
  }
  else if (rawMessage.type === 'MessageStatusOutboundMessage') {
    console.log('received message status outbound message', rawMessage.payload);
    dispatch(messagesAction.receiveMessageStatus(rawMessage.payload));
  }
  else if (rawMessage.type === 'AcknowledgementOutboundMessage') {
    console.log('received acknowledgement message', rawMessage.payload);
    
    try {
      let parsedAck = JSON.parse(rawMessage.payload.messageUid);
      if (typeof parsedAck === 'object' && parsedAck.type) {
        if (rawMessage.payload.status === Consts.ERROR) {
          if (parsedAck.type === 'deleteFromRoom') {
            /*
            * Since on thread update we update the participants without know if the removal was successful,
            * we check for error and if there's error we re add the participant from contact
            * We also try to get room natural name and user full name for the error message.
            * */
            let rooms = roomsUtils.getRooms();
            let contacts = getContacts();
            let threads = getThreads();

            let foundRoom = ( rooms || []).find((room) => {
              return parsedAck.payload.roomName === room.name;
            });

            let foundContact = ( contacts || []).find((contact) => {
              return parsedAck.payload.username === contact.username;
            });

            let foundThread = ( threads || []).find((thread) => {
              return parsedAck.payload.roomName === thread.id;
            });

            let participants = foundThread.participants;
            let foundParticipant = ( participants || []).find((participant) => {
              return parsedAck.payload.username === participant.username;
            });

            if (!foundParticipant) {
              participants.push(foundContact);
              dispatch(threadsAction.postUpdateThread(parsedAck.payload.roomName, participants));
            }

            let naturalName = foundRoom && foundRoom.naturalName || parsedAck.payload.roomName;
            let name = foundContact && foundContact.name || parsedAck.payload.username;
            dispatch(generalAction.setFeedback({
              feedbackType: 'error',
              message: `Error occurred while trying to remove ${name} from ${naturalName}`,
              show: true
            }));
          }

          return;
        }

        if (parsedAck.type === 'deleteFromRoom') {
          dispatch(roomsAction.deleteFromRoom(parsedAck.payload.roomName, parsedAck.payload.username));
        }
        
        return;
      }
    } catch(e) { }
    dispatch(messagesAction.receiveMessageAcknowledgement(rawMessage.payload));
  }
  else if (rawMessage.type === 'LoggedInElsewhereOutboundMessage') {
    console.log('received logged in elsewhere message', rawMessage.payload);
    alert('You have logged in elsewhere. You are now being logged out of this application');
    dispatch(postLogOut());
  }
  else if (rawMessage.type === 'RosterEventOutboundMessage') {
    console.log('received roster event outbound message message', rawMessage.payload);
    const user = auth.getUser();
    if ( !user ) {
      throw new Error('No user found.');
    }
    dispatch(contactsAction.fetchContactRequests());
    contactsService.fetchContacts().then((res) => {
      const newContacts = (res.status == 200 && res.data) ? res.data : [];
      const contacts = getContacts();
      const contactsMeta = getContactsMeta();

      if (contacts && newContacts.length > contacts.length) {
        const index = newContacts.findIndex((newContact) => {
          return contacts.findIndex((contact) => {
              return newContact.username === contact.username;
            }) <= -1;
        });

        if (index) {
          const mewContact = newContacts[index];
          if ( mewContact.username !== contactsMeta.username ) {
            dispatch(generalAction.setFeedback({ feedbackType: 'success', message: `${mewContact.name || mewContact.username} has accepted your Add Contact request`, show: true }));
          }
        }
      }

      dispatch(contactsAction.fetchContacts(user));
    });
  }
  else if (rawMessage.type === 'InvitationOutboundMessage') {
    console.log('received invitation outbound message message', rawMessage.payload);
    //If success no point in fetching room as it will be fetched on the next steps anyways
    dispatch(threadsAction.fetchThread(rawMessage.payload.roomName));
  }
  else if (rawMessage.type === 'RoomEventOutboundMessage') {
    if (rawMessage.payload.type === 'ROOM_NATURAL_NAME_CHANGED') {
      dispatch(roomsAction.renameRoom(rawMessage.payload.roomName, rawMessage.payload.roomNaturalName));
    }

    if (rawMessage.payload.type === 'MEMBERSHIP_REVOKED') {
      dispatch(threadsAction.removeThreadAction(rawMessage.payload.roomName));
      dispatch(roomsAction.renameRoom(rawMessage.payload.roomName));
    }

    if (rawMessage.payload.type === 'ROOM_CREATED') {
      console.log('received room created message', rawMessage.payload.type, rawMessage.payload.roomName);
      const { newRoomQueue } = roomsUtils.getRoomsMeta();
      const roomName = rawMessage.payload.roomName;

      const index = newRoomQueue.findIndex((room) => {
        return room.roomName === roomName;
      });

      if (index > -1) {
        const newRoom = newRoomQueue[index];

        newRoom.participants.forEach(function (user) {
          createRoomInvitation(roomName, user.username, Date.now());
        });
        dispatch(roomsAction.RemoveNewRoomQueue(roomName));
      }
    }

    /*
     if (rawMessage.payload.type === 'JOINED') {
     dispatch(roomsAction.roomJoin(rawMessage.payload));
     }

     if (rawMessage.payload.type === 'LEFT') {
     dispatch(roomsAction.roomLeave(rawMessage.payload));
     }*/
  }
}