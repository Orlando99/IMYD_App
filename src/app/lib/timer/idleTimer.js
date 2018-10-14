import { popWarning } from '../../utils/dom';
import * as Utils from '../../utils/index';
import * as lastChanceTimer from './lastChanceTimer';

// wait times
let timeout = Utils.minToMilliSec(15);

let timer = false;

export function setTimeout(timeoutInMinutes) {
	timeout = Utils.minToMilliSec(parseInt(timeoutInMinutes));
}

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
	return (Date.now() - timer >= timeout) && timeout !== 0;
}

export function pass(dispatch, authTimer){
	stop();
	popWarning(continueThisSession);
	lastChanceTimer.start();
}

function continueThisSession(){
	start();
	lastChanceTimer.stop();
}