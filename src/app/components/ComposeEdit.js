import React from 'react';
import ReactDOM from 'react-dom';
import $ from 'jquery';
import Avatar from './Avatar';
import ContactFormView from './ContactFormView';
import AutocompleteTag from './AutocompleteTag';
import * as Utils from '../utils/index';
import * as Consts from '../configs/constants';

export default class ComposeEdit extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			...props,
		};
	}

	handleContactClick(event) {
		const $contact = $(event.params.args.originalEvent.target).closest('.contact');
		const username = $contact.attr('data-contact-id');

		const contact = this.state.contacts.concat(this.state.thread.participants).find((user) => user.username === username);
		this.refs.tags && this.refs.tags.clear();
		this.setState({ selected: contact });
	}

	handleClose() {
		this.setState({ selected: false });
	}

	handleUnselect(event) {
		if ($(event.params.args.originalEvent.target).is('.glyphicon-info-sign')) {
			event.preventDefault();
			event.stopPropagation();
			this.handleContactClick(event);
			return false;
		}
	}

	handleSelect(event) {
		if ($(event.params.args.originalEvent.target).is('.glyphicon-info-sign')) {
			event.preventDefault();
			event.stopPropagation();
			this.handleContactClick(event);
			return false;
		}
	}

	render() {
		const thread = this.state.thread;
		let content;
		if (this.state.selected) {
			content = (
				<div className="contacts-container">
					<div className="room-name">
						Room Name: <span className="name">{thread.naturalName}</span>
					</div>
					<ContactFormView
						store={this.props.store}
						contact={this.state.selected}
						closable={true}
						handleClose={() => this.handleClose()} />
				</div>
			);
		}
		else {
			let nameInput;
			const inputProps = {
				type: 'text',
				ref: 'name',
				placeholder: 'name',
				className: 'name'
			};

			inputProps.defaultValue = thread.naturalName;

			if (thread.participants.length < 2) {
				inputProps.className += ' hidden';
			}

			nameInput = (
				<input {...inputProps} />
			);

			// this.state.rooms.forEach(room => {
			// 	room.photoUrl = '/images/red_group_profile.png';
			// });
			const collection = this.state.contacts;//.concat(this.state.rooms);
			this.state.selectedValues = this.state.selectedValues || thread.participants.map(contact => contact.username);

			content = (
				<form className="add-contact-form">
					{nameInput}
					<AutocompleteTag
						ref="tags"
						onUnselect={(e) => this.handleUnselect(e)}
						onSelect={(e) => this.handleSelect(e)}
						allowClear={false}
						placeholder="Add Contacts"
						onChange={(event) => {
							if (this.refs.name) {
								const val = $(event.target).val();
								let equal = !val || val.length === this.state.selectedValues.length;
								if (equal) {
									(val || []).forEach((username, index) => {
										if (username !== this.state.selectedValues[index]) {
											equal = false;
										}
									});
								}
								if (!equal) {
									this.setState({ selectedValues: val });
									if (val && val.length > 1) {
										this.refs.name.classList.remove('hidden');
									}
									else {
										this.refs.name.classList.add('hidden');
									}
								}
							}
						}}
						value={this.state.selectedValues}
						template={
							(state) => {
								if (!state.id) {
									return state.text;
								}

								const contact = collection.find(contact => {
									return contact.username === state.id || contact.name === state.id;
								});

								let template;
								if (contact && state.element) {
									template = (
										<div className="contact" data-contact-id={contact.username}>
											<Avatar
												store={this.props.store}
												name={contact.naturalName || contact.name}
												image={Utils.getContactAvatarUrl( Utils.hasAvatar(contact))}/>
											{contact.naturalName || contact.name}
											<span className="glyphicon glyphicon-info-sign"></span>
											<span className="glyphicon glyphicon-remove"></span>
										</div>
									);
								}
								else {
									template = <div>{state.text}</div>;
								}

								return $(ReactDOM.render(template, document.createElement('div')));
							}
						}
						templateSelection={
							(state) => {
								if (!state.id) {
									return state.text;
								}

								const contact = collection.find(contact => {
									return contact.username === state.id || contact.name === state.id;
								});

								let template;

								if (contact && state.element) {
									template = (
										<div className="contact">
											<Avatar
												store={this.props.store}
												name={contact.naturalName || contact.name}
												image={Utils.getContactAvatarUrl(Utils.hasAvatar(contact))}/>
											{contact.naturalName || contact.name}
										</div>
									);
								}
								else {
									template = <div>{state.text}</div>;
								}

								return $(ReactDOM.render(template, document.createElement('div')));
							}
						}
						options={collection.map(contact => {
							return {
								name: contact.naturalName || contact.name,
								value: contact.username || contact.name
							}
						})} />
					<button
						className="update"
						disabled={this.state.saving}
						onClick={e => {
							e.stopPropagation();
							e.preventDefault();

							if (this.refs.tags.value && this.refs.tags.value.length > 0) {
								let users = [];
								this.refs.tags.value.forEach(val => {
									const user = this.state.contacts.find(contact => contact.username === val);
									if (user) {
										users.push(user);
									}
									const room = this.state.rooms.find(room => room.name === val);
									if (room) {
										users = users.concat(room.users);
									}
								});
								this.state.onUpdateThread(this.state.thread.id, users, this.refs.name.value);
								this.refs.tags.clear();
							}

							this.state.onSave();
							return false;
						}}>
						{this.props.buttonText || 'Update'}
					</button>
				</form>
			);
		}

		return (
			<div>
				{content}
			</div>
		);
	}
};
