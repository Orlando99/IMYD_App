import React, { PropTypes, Component } from 'react';
import { connect } from 'react-redux'
import { countTotalUnread } from '../utils/threads';

const node = document.getElementById('favicon');

function setTitle(count) {
	node.href = "/images/favicon-16x16-unread.png";
	document.title = `(${ count }) IM Your Doc`;
}

function resetTitle() {
	node.href = "/images/favicon-16x16.png";
	document.title = `IM Your Doc`;
}

export function updateCount() {
	const count = countTotalUnread();
	if (count) {
		setTitle(count);
	}
	else {
		resetTitle();
	}
}