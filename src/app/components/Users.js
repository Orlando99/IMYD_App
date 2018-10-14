import React from 'react';
import ReactDOM from 'react-dom';
import $ from 'jquery';
import Select from 'select2';
import classnames from 'classnames';
import SearchBar from './SearchBar';
import Avatar from './Avatar';
import Modal from './Modal';
import ContactFormNew from './ContactFormNew';
import ContactFormView from './ContactFormView';
import * as Utils from '../utils/index';
import { getStore } from '../utils/store';
import { openModelWindow, closeModelWindow } from '../utils/dom';

export default class Users extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			filter: null
		};
		this.handleContactClick = this.handleContactClick.bind(this);
		this.openContactFormNew = this.openContactFormNew.bind(this);
		this.onSearch = this.onSearch.bind(this);
	}

	componentDidMount() {
		this.container = document.querySelector('#regular-modals');
	}

	closeModelWindow() {
		closeModelWindow({ container: this.container});
	}

	handleContactClick(event) {
		const $contact = $(event.target).closest('.contact');
		const username = $contact.attr('data-contact-id');

		if ($(event.target).is('.glyphicon-info-sign')) {
			this.openContactFormEdit(username);
		}
		else {
			this.props.onNewThread([
				this.props.contacts.find((contact) => contact.username === username)]);
		}
	}

	openContactFormEdit(username) {
		const contact = this.props.contacts.find(contact => contact.username === username) || {};

		ReactDOM.render((
				<Modal
					show={true}
					onBackgroundClick={() => $ ('.contact-modal').remove()}
					classNames="contact-modal"
				>
					<div className="header">
						<h3>
							View Contact
						</h3>
					</div>
					<ContactFormView contact={contact} store={ getStore() } />
				</Modal>),
			document.querySelector('#regular-modals'));
	}

	openContactFormNew() {
		const content = (
			<ContactFormNew
				closeModel={this.closeModelWindow}
				store={ getStore() }
				user={this.props.user}
				contacts={this.props.contacts}
			/>
		);

		openModelWindow({
			container: this.container,
			className: 'contact-modal-new',
			title: 'Add Contact',
			content,
			props: {
				style: { maxHeight:'500px'}
			}
		});
	}

	filterList(contact) {

		if (contact.disabled) {
			return false;
		}

		let value = this.state.filter;
		if( !value ) return true;
		const name = (contact.name || '').toLowerCase();
		const inName = name.indexOf(value) > -1 || name === value;

		const title = (contact.jobTitle || '').toLowerCase();
		const inTitle = title.indexOf(value) > -1 || title === value;

		const inNetwork = (contact.hospitals || [])
			.some(hospital => {
				const network = hospital.name.toLowerCase();
				return network.indexOf(value) > -1 || network === value;
			});

		return inName || inTitle || inNetwork;
	}

	onSearch(value) {
		this.setState({ filter: value.toLowerCase() });
	}

	render() {

		const contacts = this.props.contacts
			.filter((contact, index) => this.filterList(contact, index))
			.map((contact, index) => {
				const className = classnames({
					'is-patient': contact.userType === 'PATIENT',
					'selected': contact.selected
				}, 'contact');
				const network = contact.hospitals &&
					contact.hospitals.map(hospital => hospital.name).join(', ');

				return (
					<div
						className={className}
						key={index}
						onClick={this.handleContactClick}
						data-contact-id={contact.username}>
						<Avatar
							store={ getStore() }
							name={contact.name}
							image={Utils.getContactAvatarUrl( Utils.hasAvatar(contact) )}
							large={true} />
						<div className="summary">
							<div className="name">{contact.name}</div>
							<div className="title">{contact.jobTitle}</div>
							<div className="network" title={network}>{network}</div>
						</div>
						<span className="glyphicon glyphicon-info-sign"/>
					</div>
				);
			});

		const addContacts = (
			<div className='add-more' onClick={this.openContactFormNew}>
				<span className="glyphicon glyphicon-plus"/>
				<div className="inner-message">Click to find more Healthcare Professionals in the IMYD Directory</div>
			</div>
		);

		return (
			<div className="contacts-container">
				<div className="search-container">
					<SearchBar onSearch={this.onSearch} />
					<span
						className="glyphicon glyphicon-plus"
						onClick={this.openContactFormNew}> </span>
				</div>
				<div className="contacts">
					{contacts}
					{addContacts}
				</div>
			</div>
		);
	}
}
