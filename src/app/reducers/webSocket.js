import * as Consts from '../configs/constants';

// unfortunate workaround for https://phabricator.babeljs.io/T6777
typeof undefined;

export default function webSocket(state = [], action) {
	switch (action.type) {
		case Consts.SET_SOCKET: {
			return {
				socket: action.socket
			}
		}
		default: {
			return state;
		}
	}
}