import * as roomsAction from '../actions/rooms';
import * as threadsAction from '../actions/threads';
import * as outgoing from '../lib/webSocket/outgoing';
import { getStoreState } from './store';


export function getRooms() {
  const storeState = getStoreState();
  return storeState.rooms || false;
}

export function getRoomsMeta() {
  const storeState = getStoreState();
  return storeState.roomsMeta || false;
}

export function createRoomNaturalName(participants) {
  if (!participants.length) {
    throw new Error('Cannot create name no participants were supplied');
  }
  const firstUserName = participants[0].name || participants[0].username;
  const secondUseName = participants[1] ? participants[1].name || participants[1].username : false;

  return secondUseName ? `${firstUserName}_${secondUseName}` : firstUserName;
}

export function createNewRoom({ user, participants, roomNaturalName }) {
  return ( dispatch ) => {
    const messageUid = new Date().getTime().toString();
    const roomName = `${user.username}_${messageUid}`;
    roomNaturalName = roomNaturalName || createRoomNaturalName(participants);
    outgoing.createRoom(roomName, roomNaturalName, messageUid);
    dispatch(threadsAction.createNewThread(roomName, participants, roomNaturalName));
    dispatch(roomsAction.addNewRoomQueue({
      user,
      participants,
      messageUid,
      roomName,
      roomNaturalName,
      ready: false
    }));
  };
}