import React from 'react';
import ReactDOM from 'react-dom';
import $ from 'jquery';
import Select from 'select2';
import classnames from 'classnames';
import Avatar from './Avatar';
import ExternalInvite from './ExternalInvite';
import * as contactAction from '../actions/contacts';
import * as contactServices from '../services/contacts';
import * as Utils from '../utils/index';
import ContactFormView from './ContactFormView';
import * as Consts from '../configs/constants';
import { openModelWindow, closeModelWindow } from '../utils/dom';
import { getStore } from '../utils/store';
import { getUser } from '../utils/auth.js';

export default class ContactFormNew extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			...props,
			selectedContact: null,
			inviteExternal: false
		};

		this.selectRef = null;
		this.searchTerm = null;
	}

	componentDidMount() {
		this.container = document.querySelector('#regular-modals');
		this.initSelect2();
	}

	closeModelWindow() {
		closeModelWindow({ container: this.container});
	}

	handleSubmit(event) {
		event.stopPropagation();

		if (!this.refs.contactsList.value) {
			this.setState({ saving: true });
			this.handleSaveResponse('No username provided');
			event.preventDefault();
			return false;
		}

		const { name, username } = this.state.selectedContact;
		this.props.store.dispatch(contactAction.sendContactRequest( username, name ))
			.then(() => { this.handleSaveResponse(); })
			.catch((err) => { this.handleSaveResponse(err); });

		this.setState({ saving: true });
		event.preventDefault();
		return false;
	}

	handleSaveResponse(error) {
		this.setState({ saving: false, error: error });
		if (!error) {
			const { closeModel } = this.props;
			if (closeModel) {
				closeModel();
			} else {
				$('.contact-modal').remove();
			}
		}
	}

	initSelect2() {
		this.selectRef = $(this.refs.contactsList).select2({
			placeholder: 'Choose Contact',
			allowClear: true,
			"language": {
				"noResults": () => {
					let user = getUser();
					let noResults = 'No results found';
					if (user.userType !== Consts.PATIENT) {
						noResults = $(`<span>
							<span>We can't find a match for '${this.searchTerm}', </span>
							<span class="external-invite" style="cursor: pointer; color: #2084cc;">click here</span>
							<span> to invite them to IM Your Doc and send them a message.</span>
						</span>`);

						noResults.find('.external-invite').click(() => {
							$(this.selectRef).select2("destroy");
							this.setState({inviteExternal: true});
						});
					}
					return noResults;
				}
			},
			templateResult: (state) => {
				if (!state.id) {
					return state.text;
				}

				const name = state.name || state.username;
				const template = (
					<div className={'contact' + ( state.inRoster ? ' disabled' : '' )}>
						<Avatar
							store={this.props.store}
							name={name}
							image={Utils.getContactAvatarUrl( Utils.hasAvatar(state) )}/>
						{name}
						{
							state.inRoster
								? <span className="pull-right glyphicon glyphicon-ok"> </span>
								: null
						}
					</div>
				);
				return $(ReactDOM.render(template, document.createElement('div')));
			},
			templateSelection: (state) => {
				if (!state.id) {
					return state.text;
				}
				const name = state.name || state.username;
				const template = (
					<div className="contact">
						<Avatar
							store={this.props.store}
							name={name}
							image={Utils.getContactAvatarUrl(Utils.hasAvatar(state))}/>
						{name}
					</div>
				);
				return $(ReactDOM.render(template, document.createElement('div')));
			},
			ajax: {
				delay: 300,
				dataType: 'json',
				data: (params) => {
					return {
						query: params.term,
						page: params.page || 1
					};
				},
				transport: (params, success, failure) => {
					this.searchTerm = params.data.query;
					return contactServices.fetchContactsSearch(params).then((res) => {
						success(res.data, params);
					}).catch((err)=>{
						console.log('error fetching contacts', failure);
						failure();
					});
				},
				processResults: (data) => {
					return {
						results : data.content.filter((item) => {
							return !!item.username && !item.disabled && item.username !== this.props.user.username;
						}).map((item) => {
							if(item.inRoster) {
								item.disabled = true;
							}
							return {
								id: item.username,
								text: item.name || item.username,
								...item
							}
						}),
						pagination: {
							more: !data.last
						}
					};
				},
				cache: true
			}
		});

		this.selectRef.on("select2:selecting", (e) => {
			if(e.params && e.params.args && e.params.args.data && e.params.args.data.inRoster) {
				e.preventDefault();
			}
			return true;
		});
		this.selectRef.on("select2:select", (e) => {
			const selectedContact = e && e.params && e.params.data || null;
			this.setState({ selectedContact });
		});
	}

	componentDidUpdate() {
		if ( this.state.inviteExternal ) {
			const content = (<ExternalInvite
				closeModel={() => this.closeModelWindow() }
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
		const className = classnames({
			saving: this.state.saving,
			error: !!this.state.error
		}, 'add-contact-form');
		return (
			<div className={'contacts-container ' + className}>
				<div className="add-contact-form-top" >
					<div className="saving-container">Sending</div>
					<select ref="contactsList"> </select>
					<div className="contacts-new">
						{ this.state.selectedContact
							? <ContactFormView contact={ this.state.selectedContact } store={this.props.store} />
							: null
						}
					</div>
					<button
						style={{width:'auto'}}
						className="create"
						onClick={e => this.handleSubmit(e)}>
						Send Invite
					</button>
				</div>
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
};
