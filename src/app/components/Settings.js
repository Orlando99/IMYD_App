import React from 'react';
import ReactDOM from 'react-dom';
import classnames from 'classnames';
import ProfilePicture from './ProfilePicture';
import SecurityInfo from './SecurityInfo';
import WebSettings from './WebSettings';
import PersonalInfo from './PersonalInfo';
import PendingRequests from './PendingRequests';
import * as profileService from '../services/profile';
import * as Utils from '../utils/index';
import $ from 'jquery';

export default class Settings extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			...props,
			securitySettings: {}
		};
	}

	componentWillMount() {
		profileService.getSecurityInfo().then((res) => {
			this.setState({ securitySettings: res.data });
		});
	}

	handleSettingsItemClick(event) {
		const { user } = this.state;

		const $node = $(ReactDOM.findDOMNode(this));
		const $item = $(event.target).closest('.item');

		if ($item.length > 0) {
			const section = $item.attr('data-section');

			$node.find('.item').removeClass('selected');
			$item.addClass('selected');

			$node.find('.container').addClass('hidden');
			$node.find('.container[data-section="' + section + '"]').removeClass('hidden');
		}
	}

	render() {
		const { user, flags } = this.state;

		const personalInfoTabClassNames = classnames({
			selected: !Utils.firstLogin(flags)
		}, 'item');

		const securityTabClassNames = classnames({
			selected: Utils.firstLogin(flags)
		}, 'item');

		const personalInfoClassNames = classnames({
			hidden: Utils.firstLogin(flags)
		}, 'container');

		const securityClassNames = classnames({
			hidden: !Utils.firstLogin(flags)
		}, 'container');

		return (
			<div className="settings">
				<div className="navigation" onClick={(event) => this.handleSettingsItemClick(event)}>
					<div className="section">
						<span>Personal Settings</span>
						<div className="item" data-section="profile-picture">
							Profile Picture
						</div>
						<div className={personalInfoTabClassNames} data-section="personal-info">
							Personal Info
						</div>
						<div className={securityTabClassNames} data-section="security">
							Security
						</div>
					</div>
					<div className="section">
						<span>Preferences</span>
						<div className="item" data-section="web-settings">
							Web Settings
						</div>
					</div>
				</div>
				<div className="container hidden" data-section="profile-picture">
					<ProfilePicture
						store={this.props.store}
						user={this.state.user}
						flags={this.state.flags}
						onSaveSuccess={(user) => this.state.onSaveSuccess(user)} />
				</div>
				<div className={personalInfoClassNames} data-section="personal-info">
					<PersonalInfo
						privacyEnabled={this.state.securitySettings.privacyEnabled}
						dispatch={this.props.dispatch}
						user={this.state.user}
						flags={this.state.flags}
						onSaveSuccess={(user) => this.state.onSaveSuccess(user)} />
				</div>
				<div className="container hidden" data-section="web-settings">
					<WebSettings
						dispatch={this.props.dispatch}
						user={this.state.user}
						flags={this.state.flags}
						onSaveSuccess={(user) => this.state.onSaveSuccess(user)}
					/>
				</div>
				<div className={securityClassNames} data-section="security">
					<SecurityInfo
						user={this.state.user}
						flags={this.state.flags}
						onSecurityChange={(flag) => {
							this.state.onSecurityChange(flag)
						}}
						onSaveSuccess={(user) => this.state.onSaveSuccess(user)}
						onAcceptTOS={(flag, cb) => this.state.onAcceptTOS(flag, cb)}
						onSaveSecurity={(flags, cb) => {
							this.state.onSaveSecurity(flags, cb);
						}}
						{ ...this.state.securitySettings }/>
				</div>
			</div>
		);
	}
}
