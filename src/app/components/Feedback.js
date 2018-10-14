import React, { PropTypes, Component } from 'react';
import { connect } from 'react-redux'

export const DEFAULT_PROPS = {
	date: 0,
	feedbackType: 'success',
	message: 'No Message',
	show: false,
	style: {}
};

class Feedback extends Component {
	constructor(props) {
		super(props);
		this.state = {
			...props
		};

		this.timeout = null;
	}

	isDifferent(prevProps, nextProps){
		return prevProps.date !== nextProps.date
			|| prevProps.feedbackType !== nextProps.feedbackType
			|| prevProps.message !== nextProps.message
			|| prevProps.show !== nextProps.show
			|| prevProps.style !== nextProps.style
	}

	componentWillReceiveProps(nextProps){
		if ( this.isDifferent(this.props, nextProps) ) {
			this.setState({ ...nextProps });
		}
	}

	componentDidUpdate(){
		clearTimeout(this.timeout);
		if ( this.state.show ) {
			this.timeout = setTimeout(()=>{
				this.handleClose()
			},5000)
		}
	}

	handleClose(){
		this.setState(DEFAULT_PROPS);
	}

	render() {
		const { feedbackType, message, show, style } = this.state;
		if ( !show ) return false;
		return (
			<div className="feedback" style={style}>
				<div className={'feedback-close'} onClick={ () => { this.handleClose() }}>X</div>
				<div className={ `feedback-${feedbackType}` }>{ message }</div>
			</div>
		);
	}
}

Feedback.defaultProps = DEFAULT_PROPS;
Feedback.propTypes = {
	date: PropTypes.number,
	feedbackType: PropTypes.string,
	message: PropTypes.string,
	show: PropTypes.bool,
	style: PropTypes.object
};

function select({ feedback = {} }) {
	return {...feedback };
}

export default connect(select)(Feedback);