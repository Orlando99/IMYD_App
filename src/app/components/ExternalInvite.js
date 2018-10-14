import React from 'react';
import ReactDOM from 'react-dom';
import classnames from 'classnames';
import Textarea from 'react-textarea-autosize';
import $ from 'jquery';
import * as Consts from '../configs/constants';
import * as contactActions from '../actions/contacts';
import * as pendingRequestsActions from '../actions/PendingRequests';
import { getUser } from '../utils/auth';
import { getStore } from '../utils/store';
import { prepareSentExternalRequests } from '../utils/contacts';
import ValidationError from './ValidationError';

export default class ExternalInvite extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			...props,
			validationError: {},
			isValid: true
		};

		this.checkValidityDebouner = null;
	}

	componentDidMount() {
		$(this.refs.personIs).select2();
	}

	checkValidity(refName) {
		switch(refName) {
			case 'inviteeFirstName':
				if(!this.refs[refName].value) {
					this.setState({ validationError: { inviteeFirstName: "First name is required"}, isValid: false });
					return false;
				}
				break;
			case 'inviteeLastName':
				if(!this.refs[refName].value) {
					this.setState({ validationError: { inviteeLastName: "Last name is required"}, isValid: false });
					return false;
				}
				break;
			case 'inviteeEmail':
				if(!this.refs[refName].value) {
					this.setState({ validationError: { inviteeEmail: "Email is required"}, isValid: false });
					return false;
				}
				let reg = new RegExp(/^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/);
				if(!reg.test(this.refs[refName].value)) {
					this.setState({ validationError: { inviteeEmail: "Email is in the wrong format"}, isValid: false });
					return false;
				}


				break;
			case 'rawBody':
				if(!this.refs[refName].value) {
					this.setState({ validationError: { rawBody: "Message is required"}, isValid: false });
					return false;
				}

				if(this.refs[refName].value.length > 2000) {
					this.setState({ validationError: { rawBody: "This message is too long. Please shorten it and try again."}, isValid: false });
					return false;
				}
				break;
			case 'submit':
				if ( !this.checkValidity('inviteeFirstName')
					|| !this.checkValidity('inviteeLastName')
					|| !this.checkValidity('inviteeEmail')
					|| !this.checkValidity('rawBody')
				) {
					return false;
				}
		}

		this.setState({ validationError: {}, isValid: true });
		return true
	}

	clearValidity() {
		if(!this.state.isValid) {
			this.setState({ validationError: {}});
		}
	}

	deboundCheckValidity(refName) {
		if(this.checkValidityDebouner) {
			clearTimeout(this.checkValidityDebouner);
		}
		this.checkValidityDebouner = setTimeout(() => {
			this.checkValidity(refName);
			clearTimeout(this.checkValidityDebouner);
		},500);
	}

	handleSubmit(e) {
		e.stopPropagation();
		clearTimeout(this.checkValidityDebouner);
		if (this.checkValidity('submit')) {

			let { dispatch } = getStore();
			let user = getUser();
			let hospitals = user && user.hospitals || [];

			let data = {
				inviteeEmail: this.refs.inviteeEmail.value,
				inviteeFirstName: this.refs.inviteeFirstName.value,
				inviteeLastName: this.refs.inviteeLastName.value,
				inviteePatient: this.refs.personIs.value == Consts.PATIENT,
				rawBody: this.refs.rawBody.value
			};

			if (this.refs.personIs.value !== 'OTHER' && this.refs.personIs.value !== Consts.PATIENT) {
				data.hospitalId = this.refs.personIs.value;
			}

			dispatch(contactActions.sendExternalInvite(data)).then(()=> {
				let requests = prepareSentExternalRequests(data, hospitals);
				dispatch(pendingRequestsActions.addContactRequestAction('sentExternal',requests[0]));
				this.state.closeModel();
			}).catch((err)=>{
				console.log('there was an error sending the invitation ', err);
			})
		}
		e.preventDefault();
		return false;
	}

	sortHospitals(a, b) {
		if (a.primary) {
			return -1;
		}
		return 1;
	}

	render() {
		let user = getUser();
		let hospitals = user && user.hospitals && user.hospitals.sort(this.sortHospitals) || [];

		const className = classnames({
			saving: this.state.saving,
			error: !!this.state.error
		}, 'external-invite-container');

		const { validationError } = this.state;

		return (
			<div className={className}>
				<div className="pull-left external-invite-left">
					<div className="external-invite-left-img" />
					<div className="external-invite-title">Please enter details of the person you<br/>would like to send a message to.<br/><br/>
						They will receive an email <br/>notification and will be <br/>able view your message (and <br/>respond) via IM Your Doc.</div>
				</div>
				<div className="pull-left external-invite-right">
					<form ref="form">
						<div className="row">
							<div className="col-sm-6">
								<label>First Name</label>
								<input
									type="text"
									ref="inviteeFirstName"
									className={ validationError.inviteeFirstName ? 'invalid' : '' }
									onBlur={ (e) => { this.checkValidity('inviteeFirstName') }}
									onChange={ (e) => {
										this.clearValidity();
										this.deboundCheckValidity('inviteeFirstName');
									}}/>
								<ValidationError>{validationError.inviteeFirstName}</ValidationError>
							</div>
							<div className="col-sm-6">
								<label>Last Name</label>
								<input
									type="text"
									ref="inviteeLastName"
									className={ validationError.inviteeLastName ? 'invalid' : '' }
									onBlur={ (e) => { this.checkValidity('inviteeLastName') }}
									onChange={ (e) => {
										this.clearValidity();
										this.deboundCheckValidity('inviteeLastName');
									}}/>
								<ValidationError>{validationError.inviteeLastName}</ValidationError>
							</div>
						</div>

						<div className="row">
							<div className="col-sm-12">
								<label>Email</label>
								<input
									type="text"
									ref="inviteeEmail"
									className={ validationError.inviteeEmail ? 'full-length invalid' : 'full-length' }
									onBlur={ (e) => { this.checkValidity('inviteeEmail') }}
									onChange={ (e) => {
											this.clearValidity();
											this.deboundCheckValidity('inviteeEmail');
										}}/>
								<ValidationError>{validationError.inviteeEmail}</ValidationError>
							</div>
						</div>

						<div className="row">
							<div className="col-sm-12">
								<label>This person is </label>
								<select ref="personIs" defaultValue={Consts.PATIENT}>
									<option key="0" value={Consts.PATIENT}>Patient</option>
									{ hospitals.map((hospital, key)=> {
										return <option key={key+1} value={hospital.id}>Colleague at {hospital.name}</option>
									}) || false}
									<option key={hospitals.length || 1 } value="OTHER">Other Health Care Professional</option>
								</select>
							</div>
						</div>

						<div className="row">
							<div className="col-sm-12">
								<label>Message</label>
									<Textarea
										rows={4}
										maxRows={4}
										ref="rawBody"
										className={ validationError.rawBody ? 'full-length invalid ' : 'full-length' }
										onBlur={ (e) => { this.checkValidity('rawBody') }}
										onChange={ (e) => {
											this.clearValidity();
											this.deboundCheckValidity('rawBody');
										}}/>
								<ValidationError>{validationError.rawBody}</ValidationError>
							</div>
						</div>

						<button
							disabled={!this.state.isValid}
							onClick={e => this.handleSubmit(e)}>
							Send
						</button>
					</form>
				</div>
			</div>
		);
	}
};
