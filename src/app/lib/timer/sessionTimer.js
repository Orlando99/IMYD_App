import { disconnectMessage } from '../../utils/dom';
import * as Utils from '../../utils/index';
import configs from './../../configs/configs';
import * as authAction from '../../actions/auth';
import { extendSession } from '../../services/auth';

// wait times
let timeout = Utils.minToMilliSec(configs.sessionTimeout);

let timer = false;

let retries = 10;
let retried = 0;

// flag for opened warning
let warningOpened = false;

export function shouldCheck() {
	return timer;
}

export function start(now) {
	timer = now || Date.now();
}

export function stop() {
	timer = false;
}

export function check() {
	return Date.now() - timer >= timeout;
}

function reset() {
	disconnectMessage.hide();
	warningOpened = false;
	retried = 0;
}

export function pass(dispatch, authTimer) {
	stop();
	extendSession().then(()=> {

		start();
		reset();

	}).catch((err)=> {

		if(err.response && err.response.status == 401) {
			authTimer.stop();
			reset();
			dispatch(authAction.postLogOut());
			return;
		}

		if(retried > retries) {
			authTimer.stop();
			reset();
			dispatch(authAction.postLogOut());
			return;
		}

		if (!warningOpened) {
			disconnectMessage.show('We seem to be having a problem with your connection, reconnecting...');
			warningOpened = true;
		}
		start(Date.now() - timeout + 10);
		retried++;

	});
}