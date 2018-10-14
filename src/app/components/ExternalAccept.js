import React from 'react';
import ReactDOM from 'react-dom';
import cookies from 'my-simple-cookie';
import Login from '../components/Login';
import * as Utils from '../utils/index';
import configs from '../configs/configs';
import * as contactServices from '../services/contacts';

export default class ExternalAccept extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			...props,
			invitation: null,
			itIsMe: null,
			loading: false,
			error: false
		};
	}

	componentDidMount() {
		contactServices.openExternalInvite(this.props.token).then((res) => {
			this.setState({ loading: false, invitation: res.data });
		}).catch((err) => {
			let res = err && err.response && err.response.data || {};
			console.log('Error fetching invitation', res.message || res);
			this.setState({ loading: false, invitation: null, error: 'Sorry, that message has expired.' });
		});
	}

	handleClick(itIsMe) {
		if(itIsMe) {
			cookies.set('invToken', this.props.token, { domain: `.${ configs.domain }` });
			window.history.pushState("", document.title, window.location.pathname);
		}
		this.setState({ itIsMe: itIsMe });
	}

	render() {
		let { dispatch, loginError } = this.props;
		let content;

		if( this.state.itIsMe === null && this.state.invitation) {
			let { inviteeFirstName, inviteeLastName } = this.state.invitation;
			content = <div>
				<div className="title">This secure message is intended to be read by the recipient only. Are you {inviteeFirstName} {inviteeLastName}?</div>
				<div className="row">
					<div className="col-xs-4 col-xs-offset-1">
						<button name="yes" onClick={e => this.handleClick(true) } >Yes</button>
					</div>
					<div className="col-xs-4 col-xs-offset-1">
						<button name="no" onClick={e => this.handleClick(false) } >No</button>
					</div>
				</div>
				<div className="clearfix"></div>
			</div>;
		}

		if( this.state.itIsMe === true ) {
			let { senderFirstName, senderLastName } = this.state.invitation;

			content = <div>
				<div  className="title">
					<a href={ `${ configs.mainSiteUrl }/registration/registration_step1` }> Join IM Your Doc</a>
					<span> to message securely with {senderFirstName} {senderLastName}</span>
				</div>
				<div className="separator">
					<span className="external-accept-or">OR</span>
				</div>
				<div className="clearfix"></div>
				<div className="title"> Log in with my existing IM Your Doc account </div>
				<Login dispatch={dispatch} error={loginError}/>
			</div>
		} else if( this.state.itIsMe === false ) {
			content = <div  className="title">
				<span> Thank you. Please disregard this message.</span>
			</div>
		}

		if ( this.state.loading ) {
			content = <div>Loading...</div>;
		} else if ( this.state.error ) {
			content = <div className="error">{ this.state.error }</div>;
		}

		return (
			<div className="external-accept-container"> { content } </div>
		);
	}
}
