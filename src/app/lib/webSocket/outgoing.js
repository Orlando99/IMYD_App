import { getSocket, isSocketConnected } from '../../utils/socket';
import * as Utils from '../../utils/index';
import * as Consts from '../../configs/constants';

export function sendMessage(message, to, threadType) {
  if (!isSocketConnected('message')) {
    return false;
  }
  const socket = getSocket();
  console.log(`sending inbound message to user ${to}`, message);
  socket.emit('sendMessage', JSON.stringify({
    to,
    type: threadType,
    body: message.text,
    messageUid: message.messageId
  }));
}

export function sendAttachment(messageId, to, filename, fileExtension, mimeType, bytes, threadType) {
  if (!isSocketConnected('attachment')) {
    return false;
  }
  const socket = getSocket();
  console.log(`sending sendAttachment to user ${to}`);
  socket.emit('sendAttachment', JSON.stringify({
    to,
    filename,
    fileExtension,
    mimeType,
    messageUid: messageId + '',
    type: threadType,
    body: Utils.UInt8ArrayToByteArray(bytes)
  }));
}

export function forwardAttachment({ messageId, messageUid, to, type }) {
  if (!isSocketConnected('message')) {
    return false;
  }
  const socket = getSocket();
  console.log(`forwarding attachment to user ${to}`);
  socket.emit('forwardAttachment', JSON.stringify({ messageId, messageUid, to, type }));
}

export function setReadStatus(messageId, toUsername) {
  if (!isSocketConnected('read status')) {
    return false;
  }
  const socket = getSocket();
  socket.emit('sendMessageStatus', JSON.stringify({
    messageId,
    toUsername,
    status: Consts.DISPLAYED,
    messageUid: messageId + ''
  }));
}

export function setDeliveredStatus({ messageId, toUsername, messageUid }) {
  if (!isSocketConnected('deliver status')) {
    return false;
  }
  const socket = getSocket();
  socket.emit('sendMessageStatus', JSON.stringify({
    status: Consts.DELIVERED,
    messageId,
    toUsername,
    messageUid
  }));
}

export function sendComposing(to, threadType) {
  if (!isSocketConnected('composing indication')) {
    return false;
  }
  const socket = getSocket();
  socket.emit('sendChatState', JSON.stringify({
    to,
    type: threadType,
    state: 'COMPOSING',
    messageUid: new Date().getTime().toString(),
  }));
}

export function pauseComposing(to, threadType) {
  if (!isSocketConnected('pause composing indication')) {
    return false;
  }
  const socket = getSocket();
  socket.emit('sendChatState', JSON.stringify({
    to,
    type: threadType,
    state: 'PAUSED',
    messageUid: new Date().getTime().toString(),
  }));
}

export function createRoom(roomName, roomNaturalName, messageUid) {
  if (!isSocketConnected('create room')) {
    return false;
  }
  const socket = getSocket();
  socket.emit('createRoom', JSON.stringify({
    roomName,
    roomNaturalName,
    subject: null,
    messageUid
  }));
}

export function createRoomInvitation(roomName, username, messageUid) {
  if (!isSocketConnected('create room invitation')) {
    return false;
  }
  const socket = getSocket();
  socket.emit('inviteToRoom', JSON.stringify({
    roomName,
    reason: null,
    toUsername: username,
    messageUid
  }));
}

export function joinRoom(roomName, messageUid) {
  if (!isSocketConnected('join room')) {
    return false;
  }
  const socket = getSocket();
  console.log(`Sending joined room `);
  socket.emit('joinRoom', JSON.stringify({
    name: roomName,
    messageUid
  }));
}

export function deleteFromRoom(toUsername, roomName, messageUid) {
  if (!isSocketConnected('Delete From Room')) {
    return false;
  }
  const socket = getSocket();
  console.log(`Sending Delete From Room `);
  socket.emit('deleteFromRoom', JSON.stringify({
    roomName,
    toUsername,
    messageUid
  }));
}

export function renameRoom(roomName, roomNaturalName) {
  if (!isSocketConnected('rename room')) {
    return false;
  }
  const socket = getSocket();
  socket.emit('renameRoom', JSON.stringify({
    roomName,
    roomNaturalName,
    messageUid: new Date().getTime().toString(),
  }));
}