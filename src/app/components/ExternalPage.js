import React from 'react';
import ReactDOM from 'react-dom';

export default class ExternalPage extends React.Component {
	constructor(props) {
		super(props);
	}

	render() {
		return (
			<div className="external-page-wrap">
				<div className="external-page">
					<span className="logo"></span>
					{this.props.children}
				</div>
			</div>
		);
	}
}
