import io from 'socket.io-client';
import * as incoming from './incoming';
import * as generalAction from '../../actions/general';
import { getStore } from '../../utils/store';

export default function initializeSocket() {
  return new Promise((resolve, reject) => {
    const { dispatch } = getStore();
    const isSSL = location.protocol === 'https:';
    const wsUrl = (isSSL ? 'https://' : 'http://') + location.host;
    const socket = io(wsUrl, { transports: [ 'websocket' ], secure: isSSL });
    socket.on('connect', function (res) {
      dispatch(generalAction.setSocket(socket));
      resolve(res);
    });

    socket.on('connect_error', (err) => {
      dispatch(generalAction.setSocket());
      reject(err);
    });

    socket.on('connect_failed', function(err) {
      dispatch(generalAction.setSocket());
      reject(err);
    });

    socket.on('/received/message', function (message) {
      incoming.RECEIVE_MESSAGE(message);
    });

    socket.on('disconnect', function () {
      dispatch(generalAction.setSocket());
      incoming.DISCONNECTED();
    });

    socket.on('reconnect', function () {
      incoming.RECONNECTED();
    });
  });
}