import React from 'react';
import ReactDOM from 'react-dom';
import $ from 'jquery';
import Avatar from './Avatar';
import AutocompleteTag from './AutocompleteTag';
import * as Utils from '../utils/index';
import * as Consts from '../configs/constants';
import ExternalInvite from './ExternalInvite';
import { openModelWindow } from '../utils/dom';
import { getStore } from '../utils/store';

export default class ComposeNew extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			...props
		};
	}
	componentDidMount() {
		this.container = document.querySelector('#regular-modals');
	}

	isGroup(contact) {
		return contact.naturalName || contact.description;
	}

	getPhotoUrl(contact) {
		const hasPatient = (contact.users || []).some(user => user.userType === Consts.PATIENT);
		if (this.isGroup(contact)) {
			if (hasPatient) {
				return '/images/red_group_profile.png';
			}
			else {
				return '/images/green_group_profile.png';
			}
		}
		else {
			return Utils.getContactAvatarUrl( Utils.hasAvatar(contact) );
		}
	}

	componentDidUpdate() {
		if ( this.state.inviteExternal ) {
			const content = (<ExternalInvite
				closeModel={() => this.state.onSave() }
				store={ getStore() }/>);

			openModelWindow({
				container: this.container,
				title: 'Send message to new user',
				className: 'contact-modal-external-invite',
				content,
				props: {
					noAnimate: true
				}
			});
		}
	}

	render() {
		let nameInput;
		const inputProps = {
			type: 'text',
			ref: 'name',
			placeholder: 'name',
			className: 'name ' + (!this.state.forceRoom ? 'hidden' : '')
		};

		nameInput = (
			<input {...inputProps} />
		);

		const collection = this.state.contacts.concat(this.state.rooms);

		return (
			<div>
				<form className="add-contact-form">
					{nameInput}
					<AutocompleteTag
						ref="tags"
						allowClear={false}
						placeholder="Add Contacts"
						onChange={(event) => {
						const val = $(event.target).val();
						if (this.state.forceRoom || val && val.length > 1) {
							this.refs.name.classList.remove('hidden');
						}
						else {
							this.refs.name.classList.add('hidden');
						}
					}}
						value={null}
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
									<div className="contact">
										<Avatar
											store={this.props.store}
											name={contact.naturalName || contact.name}
											image={ this.getPhotoUrl(contact) }/>
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
						onSelect={(event) => {
						let id;
						try {
							id = event.params.args.data.id;
						} catch(e) {
							console.log(e);
						}

						const contact = collection.find(contact => {
							return contact.name === id;
						});

						if (contact && this.isGroup(contact)) {
							this.state.onThreadChange('', contact);
							$(ReactDOM.findDOMNode(this.refs.tags)).select2("close");
							this.state.onSave();
							return false;
						}
					}}
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
											image={ this.getPhotoUrl(contact) }/>
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
						options={collection.filter((contact) => { return !contact.disabled; }).map(contact => {
						return {
							name: contact.naturalName || contact.name,
							value: contact.username || contact.name
						}
					})} />
					<button
						className="create"
						disabled={this.state.saving}
						onClick={e => {
						e.stopPropagation();
						// this.refs.name.setCustomValidity('');
						// if (!this.refs.name.classList.contains('hidden') && !this.refs.name.value) {
						// 	this.refs.name.setCustomValidity('Must enter name');
						// 	return false;
						// }
						e.preventDefault();

						const minCount = this.state.forceRoom ? 2 : 1;
						if (this.refs.tags.value && this.refs.tags.value.length >= minCount) {
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
							this.state.onNewThread(users, this.refs.name.value);
							this.refs.tags.clear();
							this.state.onSave();
						}
						return false;
					}}>
						{this.props.buttonText || 'add'}
					</button>
				</form>
				<div className="add-contact-external">
					<div className="separator">
						<span className="external-accept-or">OR</span>
					</div>
					<div className="external-link">
						<a onClick={() => { this.setState({inviteExternal: true}); }}>Send a message to a new user</a>
						<span> who isn't in the IMYD directory yet.</span>
					</div>
				</div>
			</div>
		);
	}
}