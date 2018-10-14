import React from 'react';
import Avatar from './Avatar';
import * as Utils from '../utils/index';

export default class ContactFormView extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			...props
		};
	}

	componentWillReceiveProps(nextProps) {
		if ( nextProps.contact.username !==  this.props.contact.username) {
			this.setState({ contact: nextProps.contact});
		}
	}

	render() {
		const { contact } = this.state;
		let name = contact.name;
		const title = contact.jobTitle && contact.jobTitle.name ? contact.jobTitle.name : contact.jobTitle;
		const username = contact.username;
		const photoUrl = Utils.getContactAvatarUrl(Utils.hasAvatar(contact));
		const phone = Utils.translatePhoneNumber(contact.phone);
		const email = contact.email;
		let practiceType = '';
		let networks = '';

		if (contact.designation) {
			const designation = typeof contact.designation === 'string' ? contact.designation : contact.designation.name;
			name +=  designation ? ', ' + designation : '';
		}

		if (contact.hospitals && contact.hospitals.length) {
			networks = (
				<div className="contact-primary-network">
					<label>Networks</label>
					{
						contact.hospitals.sort((a, b) => {
							if (a.primary) {
								return -1;
							}
							else if (b.primary) {
								return 1;
							}
							return 0;
						}).map((hospital, index) => {
							if (hospital.primary) {
								return <div title="primary network" key={index}>*{hospital.name}</div>
							}
							return <div key={index}>{hospital.name}</div>
						})
					}
				</div>
			);
		}
		if (contact.practiceType) {
			practiceType = (
				<div className="contact-practice-type">
					<label>Practice Type</label>
					{contact.practiceType.name || contact.practiceType}
				</div>
			);
		}

		let inviteButtons;
		let close;
		if (this.state.invite) {
			inviteButtons = (
				<div className="invite-buttons">
					<button
						disabled={this.state.saving}
						className="accept"
						onClick={(e) => {
							this.setState({ saving: true });
							this.state.handleAccept(e).then(()=>{
								this.setState({ saving: false });
								this.state.handleStatusChange();
							}).catch((err)=>{
								this.setState({ saving: false });
								this.state.handleStatusChange(err);
							});
						}}>Accept</button>
					<button
						className="decline"
						disabled={this.state.saving}
						onClick={(e) => {
							this.setState({ saving: true });
							this.state.handleDecline(e).then(()=>{
								this.setState({ saving: false });
								this.state.handleStatusChange();
							}).catch((err)=>{
								this.setState({ saving: false });
								this.state.handleStatusChange(err);
							});
						}}>Decline</button>
				</div>
			);
		}
		if (this.state.closable) {
			close = (
				<div className="close">
					<span className="glyphicon glyphicon-remove" onClick={(e) => this.state.handleClose(e)} />
				</div>
			);
		}

		let emailPane;
		if (email) {
			emailPane = (
				<div className="contact-email">
					<span className="glyphicon glyphicon-envelope" />
					<a href={'mailto:' + email}>{email}</a>
				</div>
			);
		}

		let phonePane;
		if (phone) {
			phonePane = (
				<div className="contact-phone">
					<span className="glyphicon glyphicon-earphone" />
					{phone}
				</div>
			);
		}

		return (
			<div className="contact-form">
				{close}
				<Avatar
					store={this.props.store}
					name={name}
					image={photoUrl}
					large={true} />
				<div className="contact-name">{name}</div>
				<div className="contact-title">{title}</div>
				<div className="contact-username">({username})</div>
				{emailPane}
				{phonePane}
				{inviteButtons}
				<hr />
				{practiceType}
				{networks}
			</div>
		);
	}
};
