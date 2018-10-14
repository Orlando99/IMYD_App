import React from 'react';
import classnames from 'classnames';
import * as Utils from '../utils/index';
import * as profileAction from '../actions/profile';
import { setFeedback } from '../actions/general';
import * as profileService from '../services/profile';
import * as notifications from '../lib/notifications';
import * as idleTimer from '../lib/timer/idleTimer';
import $ from 'jquery';

export default class WebSettings extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			...props,
			...{unMounting: false }

		};
	}

	componentDidMount(){
		profileService.getWebSettings().then((res) => {
			if (res && res.data && !this.state.unMounting ) {
				this.setState(res.data);
			}
		});
	}

	componentWillUnmount(){
		this.setState({ unMounting: true });
	}

	handleSubmit(e) {
		const { dispatch } = this.props;
		const data = {
			enableSoundNotification: this.refs.enableSoundNotification.checked,
			timeoutInMins: this.refs.timeoutInMins.value
		};
		dispatch(profileAction.updatingWebSettings());
		dispatch(profileAction.updateWebSettings(data))
			.then(() => { this.handleResponse() })
			.catch((err) => { this.handleResponse(err) });
	}

	handleResponse(error) {
		const { user, flags, enableSoundNotification, timeoutInMins } = this.state;

		if (!Utils.firstLogin(flags) && !error) {
			notifications.setNotificationSettings( enableSoundNotification );
			idleTimer.setTimeout( timeoutInMins );
			this.state.onSaveSuccess(user);
		}
	}

	handleCheckboxChangeChange(e, prop){
		this.setState({ [ prop ]: e.target.checked });
	}

	handleInputChangeChange(e, prop){
		this.setState({ [ prop ]: e.target.value });
	}

	render() {
		const { enableSoundNotification, timeoutInMins = 15 }  = this.state;
		const check = typeof enableSoundNotification === 'undefined' || typeof enableSoundNotification === null ? true : enableSoundNotification;
		return (
			<div className="web-settings" >
				<div className="row" >
					<div className="col-md-6 col-sm-6 col-xs-12">
						<label htmlFor="enableSoundNotification">Web browser notification sound:
							<input type="checkbox"
										 id="enableSoundNotification"
										 ref="enableSoundNotification"
										 checked={ check }
										 onChange={ e => { this.handleCheckboxChangeChange(e, 'enableSoundNotification') }}
							/>
						</label>
					</div>
					<div className="col-md-6 col-sm-6 col-xs-12">
						<label htmlFor="timeoutInMins">Web session timeout:</label>
						<select ref="timeoutInMins" value={ timeoutInMins } onChange={ e => { this.handleInputChangeChange(e, 'timeoutInMins') }}>
							<option value="15">15 Minutes</option>
							<option value="30">30 Minutes</option>
							<option value="60">1 Hour</option>
							<option value="120">2 Hours</option>
							<option value="240">4 Hours</option>
							<option value="480">8 Hours</option>
							<option value="1440">1 Day</option>
							<option value="0">Never</option>
						</select>
					</div>
				</div>
				<button onClick={e => this.handleSubmit(e)}>
					Save
				</button>
			</div>
		);
	}
};