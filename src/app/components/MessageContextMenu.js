import React, { PropTypes, Component } from 'react';
import { connect } from 'react-redux'
import { setContextMenu } from '../actions/contextMenu';
import { openModelWindow, closeModelWindow } from '../utils/dom';
import ForwardMessage from './ForwardMessage';

export const DEFAULT_PROPS = {
	message: {},
	user: {},
	rooms: [],
	contacts: []
};

export default class MessageContextMenu extends Component {
	constructor(props) {
		super(props);

		this.container = null;
	}

	closeMenu() {
		this.props.dispatch(setContextMenu({ show: false }));
	}

	closeModelWindow() {
		closeModelWindow({ container: this.container});
	}

	componentDidMount() {
		this.container = document.querySelector('#regular-modals');
	}

	handleDelete(e) {
		// add to render when needed
		//<li className="context-menu-item" onClick={(e) => { this.handleDelete(e) }} >Delete</li>
		this.closeMenu();
	}

	handleForward() {
		const { message, user, rooms, contacts } = this.props;
		const content = <ForwardMessage message={message} user={user} rooms={rooms} contacts={contacts} closeModelWindow={ () => { this.closeModelWindow() } } />;
		openModelWindow({ container: this.container, className: 'forward-modal', title: 'Select Contact', content });
		this.closeMenu();
	}

	render() {

		return (
			<ul className="context-menu">
				<li className="context-menu-item" onClick={(e) => { this.handleForward(e) }} >Forward</li>
			</ul>
		);
	}
}

MessageContextMenu.defaultProps = DEFAULT_PROPS;
MessageContextMenu.propTypes = {
	message: PropTypes.object,
	user: PropTypes.object,
	rooms: PropTypes.array,
	contacts: PropTypes.array
};