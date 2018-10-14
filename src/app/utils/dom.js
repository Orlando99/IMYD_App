import React from 'react';
import ReactDOM from 'react-dom';
import Modal from './../components/Modal';
import * as notifications from './../lib/notifications';
import $ from 'jquery';

// flag
let onChangeIsBound = false;

export function bindOnChange(resetIdle) {
	if (onChangeIsBound) {
		return false;
	}

	$('body').on('click keypress mousemove', resetIdle);
	onChangeIsBound = true;
}

export function unbindOnChange(resetIdle) {
	$('body').off('click keypress mousemove', resetIdle);
	onChangeIsBound = false;
}

export function popWarning(resetIdle) {
	notifications.notify('You are about to be logged out due to inactivity', '');
	ReactDOM.render((
		<Modal show={true}>
			<div className="header">
				<h3>Warning</h3>
			</div>
			<div className="warning">
				You will be logged out in 1 minute due to inactivity.
				<br/>Press OK to continue this session
			</div>
			<button onClick={ () => {
				closeWarning();
				resetIdle();
		} }> OK </button>
		</Modal>
	), document.getElementById('warning'));
}

export function closeWarning() {
	$('#warning >:first-child').remove();
}

class DisconnectMessage {
	constructor() {
		this._container = document.getElementById('warning');
		this._isNeeded = 0;
	}

	show(message) {
		this._isNeeded++;

		ReactDOM.render(
			<Modal show={true}>
				<div className="header">
					<h3>Warning</h3>
				</div>
				<div className="warning">
					{message}
				</div>
			</Modal>,
			this._container
		);
	}

	hide() {
		if(this._isNeeded > 0){
			this._isNeeded--;
		}
		if(this._isNeeded <= 0) {
			ReactDOM.unmountComponentAtNode(this._container);
		}
	}
}

export const disconnectMessage = new DisconnectMessage();


export function openModelWindow({ container, className, title, content, props = {} }) {

	class WrapperComponent extends React.Component {
		constructor(props) {
			super(props);
			this.state = { visible: true }
		}

		close() {
			this.setState({ visible: false })
		}

		render() {
			if( !this.state.visible ) {
				return false;
			}

			return <Modal
				show={true}
				onBackgroundClick={() => this.close() }
				classNames={ className }
				{ ...props }>
				<div className="header">
					<h3> { title } </h3>
				</div>
				{ content }
			</Modal>;
		}
	}

	return ReactDOM.render(<WrapperComponent />, container);
}

export function closeModelWindow({ container }) {
	ReactDOM.unmountComponentAtNode(container);
}