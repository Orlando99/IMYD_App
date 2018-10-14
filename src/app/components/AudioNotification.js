import React, { PropTypes, Component } from 'react';
import { connect } from 'react-redux'
import * as Consts from '../configs/constants';
import * as generalAction from '../actions/general';

const defaultProps = {
	preload: 'auto',
	src: ''
};

export default class AudioNotification extends Component {
	constructor(props) {
		super(props);
		this.state = {
			...props
		}
	}

/*
	isDifferent(prevProps, nextProps){
		return prevProps.preload !== nextProps.preload
			|| prevProps.src !== nextProps.src
			||prevProps.audioStatus !== nextProps.audioStatus
	}

	componentWillReceiveProps(nextProps){
		if ( this.isDifferent(this.props, nextProps) ) {
			this.setState({ ...nextProps });
		}
	}

	componentDidUpdate(){
		const { audioStatus } = this.state;

		switch ( audioStatus ){
			case Consts.PLAY_AUDIO_NOTIFICATION:
				this.refs.audioNotification.currentTime = 0;
				this.refs.audioNotification.play();
				this.props.dispatch(generalAction.resetAudioNotification());
				break;

			case Consts.PAUSE_AUDIO_NOTIFICATION:
				this.refs.audioNotification.pause();
				break;

		}
	}*/


	render() {
		const { preload, src } = this.state;
		return <audio ref="audioNotification" id="audioNotification" src={ src } preload={ preload }/>;
	}
}

AudioNotification.defaultProps = defaultProps;
AudioNotification.propTypes = {
	preload: PropTypes.string,
	src: PropTypes.string
};

/*
function select({ audioNotification = {} }) {
	return {...audioNotification };
}

export default connect(select)(AudioNotification);
*/