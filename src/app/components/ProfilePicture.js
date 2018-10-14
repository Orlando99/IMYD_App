import React from 'react';
import ReactDOM from 'react-dom';
import Avatar from './Avatar';
import * as Utils from '../utils/index';
import $ from 'jquery'
import classnames from 'classnames';
import * as profileAction from '../actions/profile';
import { setFeedback } from '../actions/general';

const imageTypes = ['png','jpeg','jpg','gif'];
const maxFileSize = 100000;

export default class ProfilePicture extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			...props
		};
		this.files = [];
	}

	componentDidMount() {
		const node = ReactDOM.findDOMNode(this);
		const $node = $(node);
		$node.on('dragexit dragleave', (event) => {
			event.stopPropagation();
			event.preventDefault();
			node.classList.remove('drag-enter');
		});
		$node.on('dragover dragenter', (event) => {
			event.stopPropagation();
			event.preventDefault();
			node.classList.add('drag-enter');
		});
		$node.on('drop', this.handleDrop.bind(this));
	}

	validateFile(file) {
		const { dispatch } = this.props.store;
		const fileType = file.name.split('.').pop().toLowerCase();
		const fileSize = file.size;

		if (fileSize > maxFileSize) {
			dispatch(setFeedback({
				feedbackType: 'error',
				message: `File is too large to upload. Max allowed size is ${ maxFileSize } bytes or 2MB`,
				show: true
			}));
			return false;
		}

		if(imageTypes.indexOf(fileType) === -1) {
			dispatch(setFeedback({
				feedbackType: 'error',
				message: `Only images are allowed (png, jpg, gif)`,
				show: true
			}));
			return false;
		}
		return true;
	}

	handleDrop(event) {
		event.stopPropagation();
		event.preventDefault();

		const dt = event.originalEvent.dataTransfer;
		const file = dt.files[0];

		if (this.validateFile(file)) {
			this.files[0] = file;
			const filePath = window.URL.createObjectURL(file);
			this.setState({ attachment: true, currentImage: filePath, error: false });
		}

		const node = ReactDOM.findDOMNode(this);
		node.classList.remove('drag-enter');	
	}

	handleSubmit(event) {
		const file = this.getFileAttachment();
		if (file) {
			const reader = new FileReader();
			reader.onload = this.handleFileRead.bind(this, file);
			reader.readAsArrayBuffer(file);
			this.setState({ attachment: false, saving: true, error: false });
		}
		event.preventDefault();
		event.stopPropagation();
		return false;
	}

	handleFileRead(file, event) {
		const dispatch = this.props.store.dispatch;
		dispatch(profileAction.changeProfilePicture(file))
			.then((res) => { this.handleFileSubmitted(); })
			.catch((message) => {
				console.log('profile picture change failed', message);
				this.handleFileSubmitted(message);
			});
	}

	handleFileSubmitted(error) {

		this.setState({ attachment: false, saving: false});

		if (!error) {
			this.props.store.dispatch(profileAction.profileChangedAction({ photoUrl: Utils.getAvatarUrl() }));

			this.refs.fileInput.value = '';
			this.files = [];
			this.state.onSaveSuccess(this.state.user);
		}
	}

	getFileAttachment() {
		return this.refs.fileInput && this.refs.fileInput.files[0] || this.files[0];
	}

	render() {

		const className = classnames({
			'saving': this.state.saving,
			error: !!this.state.error
		}, 'profile-picture');

		const attachmentClassName = classnames({
				'has-attachment': this.getFileAttachment() != null
			}, 'glyphicon glyphicon-paperclip');

		return (
			<div className={className} onClick={(event) => {
					if (this.state.error) {
						const $target = $(event.target);
						if ($target.is('.Avatar')) {
							alert(this.state.error);
							event.preventDefault();
							event.stopPropagation();
						}
					}
				}}>
				<div className="saving-container">Saving</div>
				<Avatar
					store={this.props.store}
					name={this.state.user.name}
					image={this.state.currentImage}
					isMe={true}
					large={true} />
				<div className="buttons">
					<div className={attachmentClassName}
						title={this.getFileAttachment() && this.getFileAttachment().name}
						onClick={() => {
							if (this.getFileAttachment()) {
								if (confirm('Do you want to remove: ' + this.getFileAttachment().name)) {
									this.refs.fileInput.value = '';
									this.files = [];
									this.setState({ attachment: false, currentImage: null, error: false });
								}
							}
							else {
								this.refs.fileInput.click();
							}}}>
						<input type="file" ref="fileInput" onChange={() => {
							const file = this.getFileAttachment();
							if (file && this.validateFile(file)) {
								const filePath = window.URL.createObjectURL(file);
								this.setState({ attachment: true, currentImage: filePath, error: false });
							} else {
								this.refs.fileInput.value = '';
								this.files = [];
								this.setState({ attachment: false, currentImage: null, error: false });
							}
						}}/>
					</div>
					<div className="error-message" style={{ display: this.state.error ? 'block' : 'none' }}>
						{this.state.error}
					</div>
					<button 
						className=""
						onClick={e => this.handleSubmit(e)}>
						Save
					</button>
				</div>
			</div>
		);
	}
};
