import React from 'react';
import ReactDOM from 'react-dom';
import { connect } from 'react-redux'
import $ from 'jquery';
import Select from 'select2';
import classnames from 'classnames';
import SearchBar from './SearchBar';
import Avatar from './Avatar';
import Modal from './Modal';
import ComposeNew from './ComposeNew';
import ComposeView from './ComposeView';
import { createRoomNaturalName } from '../utils/rooms';
import * as roomsMetaAction from '../actions/roomsMeta';
import { getStore } from '../utils/store';

class Groups extends React.Component {
	constructor(props) {
		super(props);
		this.onSearch = this.onSearch.bind(this);
		this.openGroupFormNew = this.openGroupFormNew.bind(this);
	}

	onSearch(value) {
		const { dispatch } = this.props.store;
		const filter = value && value.toLowerCase() || null;
		dispatch(roomsMetaAction.setGroupFilter(filter));
	}

	handleGroupInfoClick(room, e) {
		e.stopPropagation();
		this.openGroupFormEdit(room.name);
	}

	handleGroupClick(room) {
		this.props.onThreadChange(room.name, room);
	}

	openGroupFormEdit(roomname) {
		const room = this.props.rooms.find( room => room.name === roomname) || {};

		ReactDOM.render((
			<Modal
				show={true}
				onBackgroundClick={() => $('.compose-modal').remove()}
				classNames="compose-modal"
			>
				<div className="header">
					<h3>
						View Group
					</h3>
				</div>
				<ComposeView thread={room} store={ getStore() } />
			</Modal>),
			document.querySelector('#regular-modals'));
	}

	openGroupFormNew() {
		const container = document.querySelector('#regular-modals');
		ReactDOM.render((
			<Modal
				show={true}
				onBackgroundClick={() => $('.rooms-modal').remove()}
				classNames="rooms-modal compose-modal"
			>
				<div className="header">
					<h3>Add Group</h3>
				</div>
				<ComposeNew
					store={ getStore() }
					rooms={this.props.rooms}
					contacts={this.props.contacts}
					onSave={() => ReactDOM.unmountComponentAtNode(container)}
					onNewThread={this.props.onNewThread}
					forceRoom={true}
				/>
			</Modal>),
			container);
	}

	render() {
		const { user, filter } = this.props;
		const rooms = this.props.rooms.filter((room) =>
			!filter || (room.naturalName || '').toLowerCase().includes(filter)).map((room, index) => {
			const hasPatient = !!room.users.some(user => user.userType === 'PATIENT') && user.userType != 'PATIENT';
			const className = classnames({
				'is-patient': hasPatient,
				'selected': room.selected
			}, 'room');
			let photoUrl;

			if (hasPatient) {
				photoUrl = '/images/red_group_profile.png';
			}
			else {
				photoUrl = '/images/green_group_profile.png';
			}

			const name = room.naturalName || createRoomNaturalName(room.users);
			return (
				<div
					className={className}
					key={index}
					onClick={() => this.handleGroupClick(room)}
				>
					<Avatar
						store={ getStore() }
						name={name}
						image={photoUrl}
						large={true} />
					<div className="summary">
						<div className="name">{name}</div>
					</div>
					<span
						className="glyphicon glyphicon-info-sign"
						onClick={(e) => this.handleGroupInfoClick(room, e)}
					/>
				</div>
			);
		});

		return (
			<div className="rooms-container">
				<div className="search-container">
					<SearchBar onSearch={this.onSearch} />
					<span
						className="glyphicon glyphicon-plus"
						onClick={this.openGroupFormNew}> </span>
				</div>
				<div className="rooms">
					{rooms}
				</div>
			</div>
		);
	}
}

function select(state = {}) {
	return {
		filter: state.roomsMeta && state.roomsMeta.filter || null
	};
}

export default connect(select)(Groups)