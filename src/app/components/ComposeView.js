import React from 'react';
import ReactDOM from 'react-dom';
import classnames from 'classnames';
import $ from 'jquery';
import Avatar from './Avatar';
import ContactFormView from './ContactFormView';
import * as Utils from '../utils/index';
import * as Consts from '../configs/constants';

export default class ComposeView extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			...props
		};
	}

	handleContactClick(event) {
		const $contact = $(event.target).closest('.contact');
		const username = $contact.attr('data-contact-id');

		if ($(event.target).is('.glyphicon-info-sign')) {
			const collection = this.state.thread.participants || this.state.thread.users;
			const contact = collection.find((user) => user.username === username);
			this.setState({ selected: contact });
		}
	}

	handleClose() {
		this.setState({ selected: false });
	}

	render() {
		let content;
		if (this.state.selected) {
			content = (
				<ContactFormView
					store={this.props.store}
					contact={this.state.selected}
					closable={true}
					handleClose={() => this.handleClose()} />
			);
		}
		else {
			const collection = this.state.thread.participants || this.state.thread.users;
			const users = this.state.room && this.state.room.users || this.state.thread.users;
			content = (
				<div className="contacts">
					{
						collection.map((contact, index) => {
							let isAdmin = null;

							if(users) {
								let user = users.find((user) => {
									return user.username == contact.username;
								});
								if (user) {
									isAdmin = user.admin ? <span className="is-admin" >(Admin)</span> : null;
								}
							}

							const className = classnames({
								'is-patient': contact.userType === 'PATIENT'
							}, 'contact');
							const network = contact.hospitals &&
								contact.hospitals.map(hospital => hospital.name).join(', ');
							const jobTitle = contact.jobTitle ? contact.jobTitle.name : '';

							return (
								<div
									className={className}
									key={index}
									onClick={e => this.handleContactClick(e)}
									data-contact-id={contact.username}>
									<Avatar
										store={this.props.store}
										name={contact.name}
										image={Utils.getContactAvatarUrl( Utils.hasAvatar(contact)  )}
										large={true} />
									<div className="summary">
										{ isAdmin }
										<div className="name">{contact.name}</div>
										<div className="title">{jobTitle}</div>
										<div className="network" title={network}>{network}</div>
									</div>
									<span className="glyphicon glyphicon-info-sign" />
								</div>
							);
						})
					}
				</div>
			);
		}

		return (
			<div className="contacts-container">
				<div className="room-name">
					Room Name: <span className="name">{this.state.thread.naturalName}</span>
				</div>
				{content}
			</div>
		);
	}
};
