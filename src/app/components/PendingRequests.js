import React from 'react';
import ReactDOM from 'react-dom';
import $ from 'jquery';
import classnames from 'classnames';
import ContactFormView from './ContactFormView';
import * as contactActions from '../actions/contacts';
import * as pendingRequestsAction from '../actions/PendingRequests';
import * as pendingRequestsMetaAction from '../actions/pendingRequestsMeta';
import { openModelWindow, closeModelWindow } from '../utils/dom';
import * as Consts from '../configs/constants';
import * as Utils from '../utils/index';
import SearchBar from './SearchBar';
import Avatar from './Avatar';

export default class PendingRequests extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			...props,
			filter: null,
			page: 0,
			fetching: false
		};
		this.lastSelected = null;
		this.modalContainer = null;
		this.container = null;
	}

	componentDidMount() {
		this.modalContainer = document.querySelector('#regular-modals');
		$(this.refs.requestContainer).on('scroll', this.handleScroll.bind(this));
	}

	componentWillReceiveProps(props) {
		this.setState({
			...this.state,
			...props
		});
	}

	handleAccept(event, pendingItem) {
		event.stopPropagation();
		let { store } = this.state;
		return store.dispatch(pendingRequestsAction.acceptInvitation(pendingItem));
	}

	handleDecline(event, pendingItem) {
		event.stopPropagation();
		let { store } = this.state;
		return store.dispatch(pendingRequestsAction.declineInvitation(pendingItem));
	}

	handleStatusChange(error) {
		this.setState({ saving: false, error: error });

		if(!error) {
			this.closeModelWindow();
		}
	}

	closeModelWindow() {
		closeModelWindow({ container: this.modalContainer });
	}

	openPendingContactInfo(pendingItem) {
		const content = (<ContactFormView
			store={this.props.store}
			contact={pendingItem.contact}
			invite={true}
			handleStatusChange={ (err) => { this.handleStatusChange(err)} }
			handleAccept={(e) => { return this.handleAccept(e, pendingItem) }}
			handleDecline={(e) => { return this.handleDecline(e, pendingItem) }} />);
		openModelWindow({ container: this.modalContainer, className: 'contact-modal', title: 'View Contact', content });
	}

	openSentContactInfo(pendingItem) {
		const content = (<ContactFormView
			store={this.props.store}
			contact={pendingItem.contact}/>);
		openModelWindow({ container: this.modalContainer, className: 'contact-modal', title: 'View Contact', content });
	}

	openSentExternalRequestMessage(pendingItem, e) {
		let { store, user } = this.state;
		let lastSelected = this.lastSelected;
		lastSelected && lastSelected.removeClass('selected');
		lastSelected = $(e.target).hasClass('contact') ? $(e.target) : $(e.target).closest( '.contact' );
		lastSelected.addClass('selected');
		this.lastSelected =  lastSelected;

		const threadID = Utils.buildThreadID(user.username, pendingItem.inviteeFirstName + '_' + pendingItem.inviteeLastName);
		const tempThread = {
			type: Consts.ONE_TO_ONE,
			name: threadID,
			naturalName: threadID,
			messageId: Date.now() + '_' + threadID,
			participants: [{
				...pendingItem.contact
			}],
			messages: [{
				isExternal: true,
				currentUser: false,
				file: false,
				isRead: false,
				text: pendingItem.rawBody,
				threadID,
				threadName: threadID,
				timestamp: pendingItem.timestamp,
				type: Consts.ONE_TO_ONE,
				contact: {
					username: pendingItem.contact.name
				}
			}]
		};

		return store.dispatch(pendingRequestsMetaAction.createTempThread(tempThread));
	}

	handleScroll(event) {
		let { sentExternal, sentExternalLast, fetching, page, store } = this.state;
		let slack = 50;
		const container = this.refs.requestContainer;
		if (container.scrollTop >= container.scrollHeight - container.clientHeight - slack && !fetching && !sentExternalLast) {

			page++;
			store.dispatch(contactActions.getAllExternalInvite({ page }), true).then(() => {
				this.setState({ fetching: false });
			});
			this.setState({ fetching: true, page });
		}
	}

	filterList(item) {
		const { contact } = item;

		if (contact.disabled) {
			return false;
		}

		let value = this.state.filter;
		if( !value ) return true;
		const name = (contact.name || '').toLowerCase();
		const inName = name.indexOf(value) > -1 || name === value;

		const title = (contact.jobTitle && contact.jobTitle.name || '').toLowerCase();
		const inTitle = title.indexOf(value) > -1 || title === value;

		const inNetwork = (contact.hospitals || [])
			.some(hospital => {
				const network = hospital.name.toLowerCase();
				return network.indexOf(value) > -1 || network === value;
			});

		return inName || inTitle|| inNetwork;
	}

	onSearch(value) {
		this.setState({ filter: value.toLowerCase() });
	}

	renderContactList(list, fn, hideGyphicon) {
		let { store } = this.props;
		return list && list.length && list
				.filter((item, index) => { return this.filterList(item, index) })
				.map((item, index) => {
					const { contact } = item;
					let name = contact.name || '';
					let jobTitle = contact.jobTitle && contact.jobTitle.name || '';
					let network = contact.hospitals &&
						contact.hospitals.map(hospital => hospital.name).join(', ');

					const className = classnames({
						'is-patient': contact.userType ===  Consts.PATIENT,
						'first': index == 0
					}, 'contact');

					return (
						<div className={className}
								 key={index}
								 onClick={fn.bind(this, item)}>
							<Avatar
								store={ store }
								name={contact.name}
								image={Utils.getContactAvatarUrl( Utils.hasAvatar(contact) )}
								large={true} />
							<div className="summary">
								{ name ? <div className="name">{name}</div> : false }
								{ jobTitle ? <div className="title">{jobTitle}</div> : false }
								{ network ? <div className="network" title={network}>{network}</div> : false }
							</div>
							{ hideGyphicon ? false :<span className="glyphicon glyphicon-info-sign"/> }
						</div>
					);
				});
	}

	render() {
		let { pending, declined, sent, sentExternal, store } = this.props;
		let { fetching } = this.state;
		let pendingComponents, declinedComponents, sentComponents, sentExternalComponents;

		let fetchingBlock;
		if (fetching) {
			fetchingBlock = <div className="fetching">Fetching</div>;
		}

		pendingComponents = this.renderContactList(pending, this.openPendingContactInfo) ||
			(
				<div className="contact no-data">
					{this.state.loading ? '... Loading' : 'No pending request waiting for your approval.'}
				</div>
			);

		sentComponents =  this.renderContactList(sent, this.openSentContactInfo) ||
			(
				<div className="contact no-data">
					{this.state.loading ? '... Loading' : 'None of your sent requests are waiting for approval.'}
				</div>
			);

		declinedComponents = this.renderContactList(declined, this.openSentContactInfo) ||
			(
				<div className="contact no-data">
					{this.state.loading ? '... Loading' : 'None of your sent requests have been declined.'}
				</div>
			);

		sentExternalComponents = this.renderContactList(sentExternal, this.openSentExternalRequestMessage) ||
			(
				<div className="contact no-data">
					{this.state.loading ? '... Loading' : 'None of your sent external requests have been accepted.'}
				</div>
			);

		return (
			<div className="contacts-container">
				<div className="search-container">
					<SearchBar onSearch={e => this.onSearch(e)} />
				</div>
				<div ref="requestContainer" className="contacts">
					<div className="contacts-title">Incoming Requests</div>
					{ pendingComponents}
					<div className="contacts-title">Sent Requests</div>
					{ sentComponents }
					<div className="contacts-title">Declined Requests</div>
					{ declinedComponents }
					<div className="contacts-title">Sent External Requests</div>
					{ sentExternalComponents }
					{fetchingBlock}
				</div>
			</div>
		);
	}
}