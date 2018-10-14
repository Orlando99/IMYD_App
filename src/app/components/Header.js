import React from 'react';
import ReactDOM from 'react-dom';
import $ from 'jquery';
import Avatar from './Avatar';
import Modal from './Modal';
import Settings from './Settings';
import * as Utils from '../utils/index';
import configs from './../configs/configs';

export default class Header extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			...props
		}
	}

	componentDidMount() {
		const { flags } = this.state;

		if (!Utils.firstLogin(flags)) {
			this.preventClose = false;
		}
		else {
			this.preventClose = true;
			this.handleSettingsClick();
		}
	}

	componentDidUpdate() {
		const { flags } = this.state;

		if (!Utils.firstLogin(flags)) {
			this.preventClose = false;
		}
		else {
			this.preventClose = true;
			this.handleSettingsClick();
		}
	}

	componentWillReceiveProps(props) {
		this.state = {
			...props
		};
	}

	componentWillUnmount() {
		$('body').off('click');
	}

	closeWatchHandler() {
		this.refs.userOptions.classList.add('hidden');
	}

	userIsAdmin() {
    const { user } = this.state;
    const userType = user ? user.userType : '';

    return userType.indexOf('ADMIN') >= 0;
	}

	handleUserClick() {
		this.refs.userOptions.classList.toggle('hidden');

		const isHidden = this.refs.userOptions.classList.contains('hidden');
		if (isHidden) {
			$('body').off('click', this.closeWatchHandler);
		}
		else {
			$('body').click(this.closeWatchHandler.bind(this));
		}
	}

	handleManageMyOrg() {
    window.location.replace(configs.adminSiteUrl);
  }

	handleSettingsClick() {
		ReactDOM.render((
			<Modal
				show={true}
				onBackgroundClick={e => {
					if (!this.preventClose) {
						$('#settings >:first-child').remove();
					}
					else {
						alert('You must complete Security Information before proceeding.');
					}
				}}>
				<div className="header">
					<h3>Settings</h3>
				</div>
				<Settings
					store={this.context.store}
					dispatch={this.props.dispatch}
					user={this.state.user}
					flags={this.state.flags}
					onSecurityChange={(flag) => {
						this.state.onSecurityChange(flag)
					}}
					updateContacts={() => this.state.updateContacts()}
					onAcceptTOS={(flag, cb) => {
						this.state.onAcceptTOS(flag, cb);
					}}
					onSaveSecurity={(flags, cb) => {
						this.state.onSaveSecurity(flags, cb);
					}}
					onSaveSuccess={(user) => {
						if (!this.preventClose) {
							$('#settings >:first-child').remove();
							this.state.onSettingsSaveSuccess(user);
						}
						else {
							alert('You must complete Security Informaiton before proceeding.');
						}
					}} />
			</Modal>
		), document.getElementById('settings'));
	}

	render() {
		const { user } = this.state;
		const name = user ? user.name : '';

		return (
			<div className="header-container">
				<div className="user-container" onClick={e => this.handleUserClick(e)}>
					<Avatar name={name} isMe={true} />
					{name}
					<span className="glyphicon glyphicon-chevron-down"></span>
				</div>
				<div 
					className="user-options-container hidden"
					ref="userOptions">
					<ul>
						{this.userIsAdmin() ?
							<li onClick={() => this.handleManageMyOrg()}>Manage my organization</li>
							: ''
						}
						<li onClick={() => this.handleSettingsClick()}>Settings</li>
						<li onClick={() => this.state.logout()}>Sign out</li>
					</ul>
				</div>
			</div>
		);
	}
};

Header.contextTypes = {
	store: React.PropTypes.object
};