import React, { PropTypes, Component } from 'react';
import { connect } from 'react-redux'
import * as Utils from '../utils/index';

class MessageTimestamp extends Component {

	shouldComponentUpdate(nextProps) {
		return this.props.currentTime !== nextProps.currentTime || this.props.timestamp !== nextProps.timestamp ;
	}

	render() {
		return <span className="timestamp">{Utils.formatTimestamp(this.props.timestamp, true)}</span>;
	}
}

function select({ chat = {} }) {
	return {
		currentTime: chat.currentTime
	};
}

export default connect(select)(MessageTimestamp);