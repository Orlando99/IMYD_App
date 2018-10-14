import React, { Component } from 'react';
import * as Consts from '../configs/constants';

export default class ValidationError extends Component {
	constructor(props) {
		super(props);
	}

	render() {
		const { children, top } = this.props;

		if (!children || !children.length) {
			return false;
		}

		return <span className={ 'validation-error' + (top ? ' at-top' : '') }>{ children }</span>;
	}
}
