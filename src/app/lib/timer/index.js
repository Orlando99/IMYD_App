import { bindOnChange, unbindOnChange, closeWarning, disconnectMessage } from '../../utils/dom';
import * as idleTimer from './idleTimer';
import * as lastChanceTimer from './lastChanceTimer';
import * as sessionTimer from './sessionTimer';
import * as tokenTimer from './tokenTimer';

//Timers ids:
let globalTimer;

// flags
let started = false;

const authTimer = {

	/**
	 * Start timers
	 * bind onChange
	 *
	 * @param {Function} dispatch
	 * @returns {boolean}
	 */
	start(dispatch) {
		if (started) {
			return false;
		}

		idleTimer.start();
		sessionTimer.start();
		tokenTimer.start();
		bindOnChange(idleTimer.start);
		stopTimer();
		startTimer(dispatch);
		started = true;
	},

	/**
	 * Stop timers
	 * unbind onChange
	 * close warning window
	 *
	 */
	stop() {
		idleTimer.stop();
		lastChanceTimer.stop();
		sessionTimer.stop();
		tokenTimer.stop();
		unbindOnChange(idleTimer.start);
		stopTimer();
		closeWarning();
		disconnectMessage.hide();
		started = false;
	}
};

/**
 * global timer - starts a timer that would last until stop is called
 *
 * We check all other timers in this timer.
 *
 * @param {Function} dispatch
 */
function startTimer(dispatch) {
	globalTimer = setInterval(() => {

		if ( idleTimer.shouldCheck() && idleTimer.check() ) {
			idleTimer.pass(dispatch, authTimer);
		}

		if ( lastChanceTimer.shouldCheck() && lastChanceTimer.check() ) {
			lastChanceTimer.pass(dispatch, authTimer);
		}

		if ( sessionTimer.shouldCheck() && sessionTimer.check() ) {
			sessionTimer.pass(dispatch, authTimer);
		}

		if ( tokenTimer.shouldCheck() && tokenTimer.check() ) {
			tokenTimer.pass(dispatch, authTimer);
		}

	}, 5000);
}

/**
 * Stop timer
 */
function stopTimer() {
	clearInterval(globalTimer);
}

export const start = authTimer.start;
export const stop = authTimer.stop;