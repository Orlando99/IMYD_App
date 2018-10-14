import * as Utils from '../utils/index';
import $ from 'jquery';

function clearNotification(notification, timeout) {
	if (notification) {
		notification.close();
		notification = undefined;
	}
}

/**
 * we are debounching the check so it wont happen several time and only on last state
 * in ff if you focus back into another tab - focus will fire for a sec then blur.
 *
 * @param debounce
 * @param notification
 * @returns {NodeJS.Timer|number}
 */
function onVisibilityChange(debounce, notification) {
	if (debounce) {
		clearInterval(debounce);
	}

	return setInterval(() => {
		if (!Utils.pageIsHidden()){
			clearNotification(notification);
		}
	},100);
}

let notifications = (() => {
	let notification, debounce, enableSoundNotification = true, bound = false;

	if ('Notification' in window && Notification.permission === 'granted' && !bound) {
		// Event listner for visibility change
		document.addEventListener("visibilitychange", () => { debounce = onVisibilityChange(debounce, notification) });
		$(window).focus(() => { debounce = onVisibilityChange(debounce, notification) });
	}

	function setNotificationSettings( enableSoundNoty ) {
		if (typeof enableSoundNoty === 'boolean') {
			enableSoundNotification = enableSoundNoty;
		}
	}

	function playSoundNotification() {
		if ( !enableSoundNotification ) return false;

		var audioNotification = $('#audioNotification')[0];
		audioNotification.pause();
		audioNotification.currentTime = 0;
		audioNotification.play();
	}

	function sendNotification(title,message) {
		clearNotification(notification);

		notification = new Notification(title, {
			body: message,
			iconUrl: location.protocol + '//' + location.host + '/images/notification_logo.png',
			icon: location.protocol + '//' + location.host + '/images/notification_logo.png',
			requireInteraction: true
		});

		notification.onclick = function () {
			window.focus();
			clearNotification(notification);
			this.cancel && this.cancel();
		};
	}

	return {
		playSoundNotification,
		sendNotification,
		setNotificationSettings
	};

})();

export const setNotificationSettings = notifications.setNotificationSettings;

export function notify(title, message) {

	if ( !Utils.pageIsHidden() ) {
		return false;
	}

	if ('Notification' in window) {
		if (Notification.permission === 'granted') {
			notifications.sendNotification(title, message);
			notifications.playSoundNotification();
		}
		else {
			Notification.requestPermission().then((status) => {
				if ( status === 'granted' ) {
					notifications.sendNotification(title, message);
					notifications.playSoundNotification();
				}
			});
		}
	} else {
		notifications.playSoundNotification();
	}
}
