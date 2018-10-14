import React from 'react';
import ReactDOM from 'react-dom';
import classnames from 'classnames';
import $ from 'jquery';
import Select from 'select2';
import * as Utils from '../utils/index';
import * as profileAction from '../actions/profile';
import * as profileService from '../services/profile';
import * as Consts from '../configs/constants';
import ValidationError from './ValidationError';

function initSelect2(node, transport, supportsNew, ignoreListener, withTemplate) {
	$(node).select2(Object.assign(
    {
      placeholder: '',
      allowClear: true,
      tags: supportsNew,
      createTag: (tag) => {
        return {
          id: tag.term,
          text: tag.term,
          isNew: true
        };
      },
      ajax: {
        dataType: 'json',
        data: (params) => {
          return {
            query: params.term,
            page: params.page || 1
          };
        },
        transport: (params, success) => {
          transport(params).then((res) => {
            success(res.data, params);
          });
        },
        processResults: (data, params) => {
          return {
            results : data.content.filter((item) => !!item.name).map((item) => {
              return {
                id: item.name,
                text: item.name
              }
            }),
            pagination: {
              more: !data.last
            }
          };
        },
        cache: true
      }
    },
    withTemplate &&
    {
      templateResult: (state) => {
        return $(ReactDOM.render(<div className="select-row">{ state.text }</div>, document.createElement('div')));
      },
      templateSelection: (state) => {
        return $(ReactDOM.render(<div className="select-row row-result">{ state.text }</div>, document.createElement('div')));
      }
    }
  ));

	if (!ignoreListener) {
		$(node).on('select2:select', (e) => {
			$(node).html(`<option value="${e.params.data.text}" selected="selected">${e.params.data.text}</option>`);
			initSelect2(node, transport, supportsNew, true);
		});
	}
}

export default class PersonalInfo extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			...props,
			privacyEnabled: true,
			validationError: {},
			isValid: true
		};
	}

	componentDidMount() {
		initSelect2(this.refs.primaryNetwork, profileService.fetchHospitals, false);
		initSelect2(this.refs.secondaryNetwork, profileService.fetchHospitals, false, true, true);
		initSelect2(this.refs.jobTitle, profileService.fetchJobTitles, true);
		initSelect2(this.refs.designation, profileService.fetchDesignations, true);

		if (this.state.user.userType !== Consts.PATIENT) {
			initSelect2(this.refs.practiceType, profileService.fetchPracticeTypes, true);
		}
	}

	componentWillReceiveProps(props) {
		this.state = {
			...this.state,
			...props
		};
	}

	checkValidity() {

    const { user } = this.state;

    if(!this.refs.firstName.value) {
      this.setState({ validationError: { firstName: "First name is required"}, isValid: false });
      return false;
    }

    if(!this.refs.lastName.value) {
      this.setState({ validationError: { lastName: "Last name is required"}, isValid: false });
      return false;
    }

    if(user.userType !== 'PATIENT' && !this.refs.phone.value) {
      this.setState({ validationError: { phone: "Phone is required"}, isValid: false });
      return false;
    }

    if(this.refs.phone.value  && !new RegExp(/^[^a-zA-Z0-9]*([0-9][^a-zA-Z0-9]*){10}$/).test(this.refs.phone.value) ) {
      this.setState({ validationError: { phone: "Phone number must be exactly 10 digits"}, isValid: false });
      return false;
    }

    if(user.userType !== 'PATIENT' && !this.refs.zip.value) {
      this.setState({ validationError: { zip: "Zip is required"}, isValid: false });
      return false;
    }

    if(this.refs.zip.value && !new RegExp(/^\d{5}$/).test(this.refs.zip.value) ) {
      this.setState({ validationError: { zip: "Zip code must be exactly 5 digits"}, isValid: false });
      return false;
    }


		if(!this.refs.email.value) {
			this.setState({ validationError: { email: "Email is required"}, isValid: false });
			return false;
		}

		let reg = new RegExp(/^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/);
		if(!reg.test(this.refs.email.value)) {
			this.setState({ validationError: { email: "Email is in the wrong format"}, isValid: false });
			return false;
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
			this.checkValidity();
			clearTimeout(this.checkValidityDebouner);
		},500);
	}

	handleSubmit(event) {
		event.stopPropagation();
		clearTimeout(this.checkValidityDebouner);
		if (this.refs.form.checkValidity() && this.checkValidity()) {
			const { dispatch, user } = this.state;
			const hospitals = [];

			if (this.refs.primaryNetwork && this.refs.primaryNetwork.value) {
				hospitals.push({
					primary: true,
					hospital: this.refs.primaryNetwork.value
				});
			}
      const secondaryNetwork = $(this.refs.secondaryNetwork).select2().val();
      (secondaryNetwork || []).forEach((hospital) => {
        hospitals.push({
          primary: false,
          hospital: hospital
        });
      });

			const data = {
				email: this.refs.email.value,
				firstName: this.refs.firstName.value,
				lastName: this.refs.lastName.value,
				phone: this.refs.phone.value,
				zip: this.refs.zip.value,
				hospitals: hospitals
			};

			user.email = data.email;
			user.firstName = data.firstName;
			user.lastName = data.lastName;
			user.phone = data.phone;
			user.zip = data.zip;
			user.hospitals = data.hospitals.map((hospital) => {
				return {
					primary: hospital.primary,
					name: hospital.hospital
				}
			});

			if (this.refs.designation && this.refs.designation.value) {
				user.designation = user.designation || {};
				user.designation.name = data.designation = this.refs.designation.value;
				
			}
			if (this.refs.jobTitle && this.refs.jobTitle.value) {
				user.jobTitle = user.jobTitle || {};
				user.jobTitle.name = data.jobTitle = this.refs.jobTitle.value;
			}
			if (this.refs.practiceType && this.refs.practiceType.value) {
				user.practiceType = user.practiceType || {};
				user.practiceType.name = data.practiceType = this.refs.practiceType.value;
			}

			dispatch(profileAction.changePersonalInfo(data))
				.then(() => {
					return profileService.changeSecurityInfo({ privacyEnabled: this.state.privacyEnabled }).then(() => {
						this.handleSaveResponse() })
					})
				.catch((err) => { this.handleSaveResponse(err) });

			this.setState({ saving: true });
		}
		event.preventDefault();
		return false;
	}

	handleSaveResponse(error) {
		this.setState({ saving: false });
		if (!error) {
			this.state.onSaveSuccess(this.state.user);
		}
	}

	render() {

		const className = classnames({
			'saving': this.state.saving,
			error: !!this.state.error
		}, 'personal-info');

		const { user, privacyEnabled, validationError } = this.state;

		const initialJobTitle = user.jobTitle && (
			<option value={user.jobTitle.name}>{user.jobTitle.name}</option>
		);

		const jobTitle = user.userType !== 'PATIENT'  && (
			<div>
				<label>Job Title</label>
				<select ref="jobTitle" defaultValue={user.jobTitle && user.jobTitle.name}>
					{initialJobTitle}
				</select>
			</div>
		);

		const initialDesignation = user.designation && (
			<option value={user.designation.name}>{user.designation.name}</option>
		);

		const designation = user.userType !== 'PATIENT'  && (
			<div>
				<label>Designation</label>
				<select ref="designation" defaultValue={user.designation && user.designation.name}>
					{initialDesignation}
				</select>
			</div>
		);

		const initialPracticeType = user.practiceType && (
			<option value={user.practiceType.name}>{user.practiceType.name}</option>
		);

		const practiceType = user.userType !== 'PATIENT' && (
			<div>
				<label>Practice Type</label>
				<select ref="practiceType" defaultValue={user.practiceType && user.practiceType.name}>
					{initialPracticeType}
				</select>
			</div>
		);

		let initialPrimary;
		let initialSecondary;
		let primary;
		let secondary;

		if (user.hospitals) {
			primary = user.hospitals.find((hospital) => hospital.primary);
      secondary = user.hospitals.filter((hospital) => !hospital.primary).map((hospital) => hospital.name) || [];

			initialPrimary = primary && (
				<option value={primary.name}>{primary.name}</option>
			);
			initialSecondary = ( secondary || [] ).map((hospital) => {
        return <option key={ hospital } value={ hospital }>{ hospital }</option>;
      });
		}

		const primaryNetwork = user.userType !== 'PATIENT' && (
			<div>
				<label>Primary Network</label>
				<select ref="primaryNetwork" defaultValue={primary && primary.name}>
					{initialPrimary}
				</select>
			</div>
		);

		const secondaryNetwork = user.userType !== 'PATIENT' && (
			<div className="secondary-network">
				<label>Secondary Network</label>
				<select
					ref="secondaryNetwork"
					multiple="multiple"
          defaultValue={secondary}
        >
					{initialSecondary}
				</select>
			</div>
		);

		return (
			<div className={className}>
				<div className="saving-container">Saving</div>
				<form ref="form">
					<div>
						<label>First Name</label>
						<input
              type="text"
              ref="firstName"
              defaultValue={user.firstName}
              onChange={ (e) => {
                this.clearValidity();
                this.deboundCheckValidity();
              }}
            />
            <ValidationError>{validationError.firstName}</ValidationError>
					</div>
					<div>
						<label>Last Name</label>
						<input
              type="text"
              ref="lastName"
              defaultValue={user.lastName}
              onChange={ (e) => {
                this.clearValidity();
                this.deboundCheckValidity();
              }}
            />
            <ValidationError>{validationError.lastName}</ValidationError>
					</div>
					{jobTitle}
					{designation}
					{practiceType}
					<div>
						<label>Phone</label>
						<input
              type="text"
              ref="phone"
              defaultValue={Utils.translatePhoneNumber(user.phone)}
              onChange={ (e) => {
                this.clearValidity();
                this.deboundCheckValidity();
              }}
            />
            <ValidationError>{validationError.phone}</ValidationError>
					</div>
					<div>
						<label>ZIP</label>
						<input
              type="text"
              ref="zip"
              defaultValue={user.zip}
              onChange={ (e) => {
                this.clearValidity();
                this.deboundCheckValidity();
              }}
            />
            <ValidationError>{validationError.zip}</ValidationError>
					</div>
					<div>
						<label>Email</label>
						<input type="text"
									 ref="email"
									 defaultValue={user.email}
									 onChange={ (e) => {
										this.clearValidity();
										this.deboundCheckValidity();
										}}/>
						<ValidationError>{validationError.email}</ValidationError>
					</div>
					{primaryNetwork}
					{secondaryNetwork}
					<div>
						<label className="privacy-enabled-label">Make Phone & Email Private</label>
						<input className="privacy-enabled"
									 type="checkbox"
									 ref="privacyEnabled"
									 checked={ privacyEnabled }
									 onChange={(e) => { this.setState({ privacyEnabled: e.target.checked }) }} />
					</div>
					<div className="error-message" style={{ display: this.state.error ? 'block' : 'none' }}>
						{this.state.error}
					</div>
					<button
						disabled={!this.state.isValid}
						onClick={e => this.handleSubmit(e)}>
						Save
					</button>
				</form>
			</div>
		);
	}
};
