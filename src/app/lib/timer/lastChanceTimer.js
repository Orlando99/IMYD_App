import * as Utils from '../../utils/index';
import * as authAction from '../../actions/auth';

// wait times
let timeout = Utils.minToMilliSec(1);

let timer = false;

export function shouldCheck() {
	return timer;
}

export function start() {
	timer = Date.now();
}

export function stop() {
	timer = false;
}

export function check() {
	return Date.now() - timer >= timeout;
}

export function pass(dispatch, authTimer){
	stop();
	authTimer.stop();
	dispatch(authAction.postLogOut());
}