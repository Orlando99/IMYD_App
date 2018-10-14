import React, { PropTypes, Component } from 'react';
import { connect } from 'react-redux'
import { setContextMenu } from '../actions/contextMenu';
import MessageContextMenu from './MessageContextMenu';
import $ from 'jquery';

export const DEFAULT_PROPS = {
	date: 0,
	name: '',
	data:{},
	menus: [],
	show: false,
	style: {}
};

class ContextMenu extends Component {
	constructor(props) {
		super(props);
		this.state = {
			...props
		};

		this.clickHandlerRef = this.clickHandler.bind(this);
	}

	isDifferent(prevProps, nextProps){
		return prevProps.date !== nextProps.date
			|| prevProps.menus !== nextProps.menus
			|| prevProps.event !== nextProps.event
			|| prevProps.show !== nextProps.show
			|| prevProps.style !== nextProps.style
	}

	componentWillReceiveProps(nextProps){
		if ( this.isDifferent(this.props, nextProps) ) {
			this.setState({ ...nextProps });
		}
	}

	closeMenu() {
		this.props.dispatch(setContextMenu({ show: false }));
	}

	clickHandler(event) {
		if ( !$(event.target).closest('.context-menu-container').length ) {
			this.closeMenu();
		}
	}

	bindWindow() {
		this.unbindWindow();
		$(document).on('mousedown ', this.clickHandlerRef);
	}

	unbindWindow() {
		$(document).off('mousedown ', this.clickHandlerRef);
	}

	componentDidUpdate() {
		if ( this.state.show ) {
			this.bindWindow();
		} else {
			this.unbindWindow();
		}
	}

	componentWillUnmount() {
		this.unbindWindow();
	}

	calculateMenuPosition(){
		let { width, height, left, top } = this.state;
		const windowHeight = $(window).height();
		const windowWidth = $(window).width();

		if ( windowHeight - top < height) {
			top -= height;
		}

		if ( windowWidth - left < width) {
			left -= width;
		}

		return { left, top };
	}

	render() {
		let { name, show, style, data } = this.state;
		if ( !show ) return false;

		style = Object.assign({}, style, this.calculateMenuPosition());


		let content = false;
		if (name === 'message') {
			content = <MessageContextMenu {...data}/>;
		}

		return (
			<div className="context-menu-container" style={style}>
				{ content }
			</div>
		);
	}
}

ContextMenu.defaultProps = DEFAULT_PROPS;
ContextMenu.propTypes = {
	date: PropTypes.number,
	name: PropTypes.string,
	data: PropTypes.object,
	menus: PropTypes.array,
	show: PropTypes.bool,
	style: PropTypes.object
};

function select({ contextMenu = {} }) {
	return {...contextMenu };
}

export default connect(select)(ContextMenu);