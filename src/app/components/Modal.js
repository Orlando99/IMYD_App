import React from 'react';
import ReactDOM from 'react-dom';
import classnames from 'classnames';

export default class Modal extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			...props
		}
	}

	componentDidMount() {
		ReactDOM.findDOMNode(this).focus();
	}

	componentDidUpdate() {
		ReactDOM.findDOMNode(this).focus();
	}

	componentWillReceiveProps(props) {
		this.contextAwareKeyupHandler = this.contextAwareKeyupHandler || this.handleKeyup.bind(this);
		if (props.show) {
			window.addEventListener('keyup', this.contextAwareKeyupHandler);
		}
		else {
			window.removeEventListener('keyup', this.contextAwareKeyupHandler);
		}

		this.state = {
			...props
		};
	}

	shouldComponentUpdate(props, state) {
		return props.show !== this.props.show;
	}

	handleKeyup(event) {
		if (event.keyCode === 27) {
			this.props.onBackgroundClick.call(this);
		}
	}

	render() {
		const { styles } = this.props;
		const className = classnames({
			hidden: !this.state.show,
			animate: this.state.show && !this.state.noAnimate,
			'no-animate': this.state.noAnimate
		}, `modal-container ${this.state.classNames}`);

		return (
			<div className={className} tabIndex="0">
				<div 
					className="modal-backdrop"
					onClick={this.props.onBackgroundClick}></div>
				<div className="modal" style={styles}>
					{this.props.children}
				</div>
			</div>
		);
	}
};
