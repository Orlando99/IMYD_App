import React from 'react';
import classnames from 'classnames';
import $ from 'jquery';
import ValidationError from './ValidationError';
import TermsOfService from './TermsOfService';
import HippaAgreement from './HippaAgreement';
import * as Utils from '../utils/index';
import * as profileAction from '../actions/profile';
import * as profileService from '../services/profile';
import * as authService from '../services/auth';
import * as validator from '../utils/validation';
import { getStore } from '../utils/store';


export default class SecurityInfo extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			...props,
			unMounting: false,
			validationError: {},
			isValid: true
		};

		this.availableSecurityQuestions = [
			'Who was your childhood friend?',
			'Mother\'s maiden name?',
			'In which city were you born?',
			'In which state were you born?',
			'In which province were you born?',
			'What is the name of your favorite cousin?',
			'Who is your childhood hero?',
			'What is the name of your elementary school?'
		];
	}

	componentWillUnmount() {
		this.setState({ unMounting: true });
	}
	componentDidMount() {
		$(this.refs.securityQuestion).select2();
	}

	componentWillReceiveProps(props) {
		this.state = {
			...this.state,
			...props
		};

		if (this.props.securityQuestion !== props.securityQuestion ) {
			const securityQuestion = this.availableSecurityQuestions.indexOf(props.securityQuestion) >= 0
				? props.securityQuestion
				:this.availableSecurityQuestions[0];

			$(this.refs.securityQuestion).val(securityQuestion).trigger('change');
		}
	}

	checkValidity(refName, checkRequired) {
		let results;
		switch(refName) {
			case 'pin':
				results = validator.validatePin(this.refs.pin.value, checkRequired);
				if(!results.isValid) {
					this.setState({ validationError: { pin: results.msg }, isValid: results.isValid });
					return false;
				}
				break;
			case 'password':
				results = validator.validatePassword(this.refs.password.value, checkRequired);
				if(!results.isValid) {
					this.setState({ validationError: { password: results.msg }, isValid: results.isValid });
					return false;
				}
				break;
			case 'confirm':
				results = validator.validateConfirm(this.refs.password.value, this.refs.confirm.value);
				if(!results.isValid) {
					this.setState({ validationError: { confirm: results.msg }, isValid: results.isValid });
					return false;
				}
				break;
			case 'securityAnswer':
				results = validator.validateSecurityAnswer(this.refs.securityAnswer.value, checkRequired);
				if(!results.isValid) {
					this.setState({ validationError: { securityAnswer: results.msg }, isValid: results.isValid });
					return false;
				}
				break;
			case 'answerAndQuestion':
				results = validator.validateAnswerAndQuestion(this.refs.securityQuestion.value, this.refs.securityAnswer.value);
				if(!results.isValid) {
					this.setState({ validationError: { [ results.field ]: results.msg }, isValid: results.isValid });
					return false;
				}
				break;
			case 'submit':
				if (checkRequired) {
					if ( !this.checkValidity('pin', checkRequired)
						|| !this.checkValidity('password', checkRequired)
						|| !this.checkValidity('confirm', checkRequired)
						|| !this.checkValidity('securityAnswer', checkRequired)
					) {
						return false;
					}
				}
				else {
					if ( !this.checkValidity('confirmPin') || !this.checkValidity('confirm')) {
						return false;
					}
				}
				this.checkValidity('answerAndQuestion');
				break;

			case 'tosSubmit':
				if(this.refs.tos && !this.refs.tos.checked) {
					this.setState({ validationError: { tos: 'You are required to accept terms of use agreement' }, isValid: false });
					return false;
				}

				if(this.refs.hippa && !this.refs.hippa.checked) {
					this.setState({ validationError: { hippa: 'You are required to accept HIPAA agreement' }, isValid: false });
					return false;
				}
				break;
		}

		this.setState({ validationError: {}, isValid: true });
		return true
	}

	handleSubmit(event) {
		event.stopPropagation();
		const { user, flags } = this.state;
		const store = getStore();
		const needsSecurity = Utils.needsSecurity(flags);

		if (needsSecurity || !Utils.firstLogin(flags)) {
			if (this.checkValidity('submit', needsSecurity)) {
				const password = this.refs.password.value;
				const { onSecurityChange } = this.state;
				const flag = flags.find((flag) => flag.flagType === 'CONFIG_REQUIRED');
				flag.value = false;

				const securityInfo = {
					pin: this.refs.pin.value,
					password,
					securityQuestion: this.refs.securityQuestion.value,
					securityAnswer: this.refs.securityAnswer.value
				};

				store.dispatch(profileAction.changeSecurityInfo(securityInfo)).then(() => {
					return !flag.value
						? store.dispatch(profileAction.saveFlag(flag))
						: Promise.resolve();
				}).then(() => {
					if (password) {
						return authService.logout()
							.then(() => {
								return authService.login({ username: user.username, password });
							})
							.then(() => {
								return authService.fetchAuthToken({ username: user.username, password });
							});
					}
					else {
						onSecurityChange(flag);
						return Promise.resolve();
					}
				}).then(() => {
					if (password) {
						location.reload();
					}
					this.handleResponse();
				}).catch((err) => {
					let res = err && err.response && err.response.data || {};
					const message = Utils.getError( res.errorCode || res.status);
					this.handleResponse(message);
				});

				this.setState({ saving: true });
			}
		}
		else if (Utils.needsTerms(flags)) {
			if (this.checkValidity('tosSubmit')) {
				const flag = flags.find((flag) => flag.flagType === 'TERMS_ACCEPTED');
				flag.value = true;
				const { onAcceptTOS } = this.state;
				onAcceptTOS(flag, this.handleResponse.bind(this));

				this.setState({ saving: true });
			}
		}

		event.preventDefault();
		return false;
	}

	handleResponse(error) {
		const { user, flags } = this.state;

		this.setState({ saving: false, error: error });

		if (!Utils.firstLogin(flags) && !error) {
			this.state.onSaveSuccess(user);
		}
	}

	handleSecurityAnswerChange(e) {
		this.setState({ securityAnswer: e.target.value });
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
		},300);
	}


	render() {
		let className = classnames({
			'saving': this.state.saving,
			error: !!this.state.error
		}, 'security-info');

		const { user, flags, validationError } = this.state;
		let content;

		const availableSecurityQuestions = this.availableSecurityQuestions.map((question) => {
			return <option key={ question } value={ question }>{ question }</option>;
		});

		const securityQuestion = this.availableSecurityQuestions.indexOf(this.props.securityQuestion) >= 0
			? this.props.securityQuestion
			:this.availableSecurityQuestions[0];

		if (Utils.needsSecurity(flags) || !Utils.firstLogin(flags)) {
			content = (
				<form ref="form">
					<label>PIN</label>
					<input type="password" ref="pin"
								 className={ validationError.pin ? 'invalid' : '' }
								 onBlur={ (e) => { this.checkValidity('pin') }}
								 onChange={ (e) => {
								 	this.clearValidity();
								 	this.deboundCheckValidity('pin');
								 }} />
					<ValidationError>{validationError.pin}</ValidationError>

					<label>Password</label>
					<input type="password" ref="password"
								 className={ validationError.password ? 'invalid' : '' }
								 onBlur={ (e) => { this.checkValidity('password') }}
								 onChange={ (e) => {
								 	this.clearValidity();
								 	this.deboundCheckValidity('password');
								 }}/>
					<ValidationError>{validationError.password}</ValidationError>

					<label>Confirm Password</label>
					<input type="password" ref="confirm"
								 className={ validationError.confirm ? 'invalid' : '' }
								 onBlur={ (e) => { this.checkValidity('confirm') }}
								 onChange={ (e) => {
								 	this.clearValidity();
								 	this.deboundCheckValidity('confirm');
								 }}/>
					<ValidationError>{validationError.confirm}</ValidationError>

					<label>Security Question</label><br />
					<select
						className="security-question"
						ref="securityQuestion"
						defaultValue={ securityQuestion }
					>
						{ availableSecurityQuestions }
					</select>

					<br />
					<label>Security Question Answer</label>
					<input type="password"
								 className={ `security-answer ${validationError.securityAnswer ? 'invalid' : ''}` }
								 ref="securityAnswer"
								 value={this.state.securityAnswer}
								 onBlur={ (e) => {
									 this.checkValidity('securityAnswer') ;
									 this.checkValidity('answerAndQuestion');
								 }}
								 onChange={ e => {
								 	this.handleSecurityAnswerChange(e);
								 	this.clearValidity();
								 	this.deboundCheckValidity('securityQuestion');
								 }} />
					<ValidationError top={true} >{validationError.securityAnswer}</ValidationError>

					<div className="error-message" style={{ display: this.state.error ? 'block' : 'none' }}>
						{this.state.error}
					</div>
					<button
						disabled={!this.state.isValid}
						onClick={e => this.handleSubmit(e)}>
						Save
					</button>
				</form>
			);
		}
		else if (Utils.needsTerms(flags)) {
			let hippa;

			if (user.userType === 'PATIENT') {
				className += ' patient';
			}
			else {
				hippa = (
					<div>
						<HippaAgreement />
						<input type="checkbox" className="accept-hippa" ref="hippa" id="hippa" />
						<ValidationError>{validationError.hippa}</ValidationError>
						<label htmlFor="hippa">I accept HIPAA Agreement</label>
					</div>
				);
			}

			content = (
				<form ref="form">
					<div>
						<TermsOfService />
						<input type="checkbox" className="accept-tos" ref="tos" id="tos"  />
						<ValidationError>{validationError.tos}</ValidationError>
						<label htmlFor="tos">I accept Services Agreement</label>
					</div>
					{hippa}
					<button onClick={e => this.handleSubmit(e)}>
						Save
					</button>
				</form>
			);
		}

		return (
			<div className={className}>
				<div className="saving-container">Saving</div>
				{content}
			</div>
		);
	}
};