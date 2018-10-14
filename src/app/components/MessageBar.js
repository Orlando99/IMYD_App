import React from 'react';
import PropTypes from 'prop-types';
import ReactDOM from 'react-dom';
import { connect } from 'react-redux';
import $ from 'jquery'
import classnames from 'classnames';
import { clearSearch } from '../actions/search';
import { setFeedback } from '../actions/general';
import { stashMessage } from '../actions/messages';
import Textarea from 'react-textarea-autosize';

class MessageBar extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			messageInput: '',
		};
		this.files = [];
		this.timeElapsed = Date.now();
		this.handleSubmit = this.handleSubmit.bind(this);
		this.handleExport = this.handleExport.bind(this);
		this.onKeyDown = this.onKeyDown.bind(this);
		this.onChange = this.onChange.bind(this);
		this.onOpenEMRExportDialog = this.onOpenEMRExportDialog.bind(this);
	}

	componentWillReceiveProps(nextProps) {
		if ( nextProps.threadID !==  this.props.threadID) {
			this.setState({ messageInput: nextProps.inputBuffer || '' });
			this.stopTyping(this.props.thread);
		}
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
		this.refs.messageInput.focus();
	}

	componentDidUpdate(prevProps) {
		if ( $('.modal-container:visible').length ) {
			this.refs.messageInput.blur();
		}
		else {
			this.refs.messageInput.focus();
		}
	}

	handleDrop(event) {
		event.stopPropagation();
		event.preventDefault();

		const dt = event.originalEvent.dataTransfer;
		const files = dt.files;

		this.files[0] = files[0];
		this.setState({ attachment: true });

		const node = ReactDOM.findDOMNode(this);
		node.classList.remove('drag-enter');
	}

	handleSubmit() {
		const search = this.props.search || {};

		if (search.jumpToMessageID) {
		 this.props.clearSearch(search.threadID);
		}

		const file = this.getFileAttachment();
		if (file) {
			const reader = new FileReader();
			reader.onload = this.handleFileRead.bind(this, file);
			reader.readAsArrayBuffer(file);
		}

		const message = this.state.messageInput.trim();

		if (!message && !file) {
			this.props.setFeedback({
				feedbackType: 'error',
				message: 'Please enter a message.',
				show: true
			});
			return false;
		}

		if (!message) {
			return false;
		}

		if (message.length >= 2000) {
			this.props.setFeedback({
				feedbackType: 'error',
				message: 'This message is too long. Please shorten it and try again.',
				show: true
			});
			return false;
		}

		const { addMessage, threadID, stashMessage } = this.props;
		addMessage({
			text: message,
			threadID: threadID
		});
		this.setState({ messageInput: '' });
		stashMessage(threadID, '');
	}

	handleFileRead(file, event) {
		const { addFile, threadID } = this.props;
		const resultInBytes = new Uint8Array(event.target.result);
		this.refs.fileInput.value = '';
		this.files = [];
		addFile(file, resultInBytes, threadID);
	}

	handleExport(type) {
		return () => {
			if (!this.props.selectedMessageCount) {
				return this.props.setFeedback({
					feedbackType: 'error',
					message: 'Please select at least one message.',
					show: true,
				});
			}
			this.props.exportMessages(type)();
		}
	}

	onOpenEMRExportDialog(){
		if (this.props.selectedMessageCount) {
		  this.props.toggleEMRExportDialog();
		} else {
			this.props.setFeedback({
				feedbackType: 'error',
				message: 'Please select at least one message.',
				show: true,
			});
		}
	}

	startTyping() {
		let timeElapsed = (Date.now() - this.timeElapsed) / 1000 ;
		if (!this.startedTyping || timeElapsed >= 10) {
			this.props.onTypeStart();
			this.timeElapsed = Date.now();
		}

		this.startedTyping = true;
		clearTimeout(this.typingTimeoutId);

		this.typingTimeoutId = setTimeout(() => {
			this.stopTyping();
		}, 10000);

	}

	stopTyping(thread) {
		if (this.startedTyping) {
			this.props.onTypeStop(thread);
		}
		clearTimeout(this.typingTimeoutId);
		this.startedTyping = false;
		this.timeElapsed = Date.now();
	}

	onKeyDown(event) {
		const key = event.which || event.keyCode;
		if (key === 13) {
			event.preventDefault();
			this.handleSubmit();
			this.stopTyping();
		}
	}

	onChange(event) {
		const value = event.target.value;
		this.setState({messageInput:value});
		this.props.stashMessage(this.props.threadID, value);

		if (value) {
			this.startTyping();
		}
		else {
			this.stopTyping();
		}
	}

	getFileAttachment() {
		return this.refs.fileInput && this.refs.fileInput.files[0] || this.files[0];
	}

	renderMessageBar() {
		const attachmentClassName = classnames({
			'has-attachment': this.getFileAttachment() != null
		}, 'glyphicon glyphicon-paperclip');
		return (
			<div className={classnames('message-bar', { hidden: this.props.exportVisible })}>
				<div
					className={attachmentClassName}
					title={this.getFileAttachment() && this.getFileAttachment().name}
					onClick={() => {
						if (this.getFileAttachment()) {
							if (confirm('Do you want to remove: ' + this.getFileAttachment().name)) {
								this.refs.fileInput.value = '';
								this.files = [];
								this.setState({ attachment: false });
							}
						}
						else {
							this.refs.fileInput.click();
						}}}>
					<input
						type="file"
						ref="fileInput"
						onChange={() => this.setState({ attachment: true })} />
				</div>
				<Textarea
					ref="messageInput"
					rows={1}
					placeholder="Type Message Here"
					value={this.state.messageInput}
					onKeyDown={this.onKeyDown}
					onChange={this.onChange} />
				<button
					className="action-button glyphicon glyphicon-play"
					onClick={this.handleSubmit}></button>
				<button
					className="action-button glyphicon glyphicon-save"
					onClick={this.props.onToggleExport}
				/>
			</div>
		)
	}

	renderExportBar() {
		return (
			<div className={classnames({ hidden: !this.props.exportVisible })}>
				<button
					className="export-button glyphicon glyphicon-save"
					onClick={this.handleExport('pdf')}
				>
					PDF
				</button>
				<button
					className="export-button glyphicon glyphicon-save"
					onClick={this.handleExport('text')}
				>
					TEXT
				</button>
				<button
					className="export-button glyphicon glyphicon-save"
					onClick={this.handleExport('csv')}
				>
					CSV
				</button>
				{(this.props.user && (!!this.props.user.emr && this.props.user.userType.toLowerCase() !== 'patient')) &&
					<button 
						className="export-button glyphicon glyphicon-save"
						onClick={this.onOpenEMRExportDialog}
					>
						EXPORT TO EMR
					</button>

				}
				<button className="cancel-button" onClick={this.props.onToggleExport}>
					Cancel
				</button>
			</div>
		)
	}

	render() {
		const { exportVisible } = this.props;
		return (
			<div className="message-bar-wrapper">
				{this.renderExportBar()}
				{this.renderMessageBar()}
			</div>
		);
	}
}

MessageBar.propTypes = {
	exportVisible: PropTypes.bool,
	selectedMessageCount: PropTypes.number,
	clearSearch: PropTypes.func,
	setFeedback: PropTypes.func,
	onToggleExport: PropTypes.func,
	exportMessages: PropTypes.func,
	toggleEMRExportDialog: PropTypes.func,
};

export default connect(
	state => ({}),
	{ clearSearch, setFeedback, stashMessage },
)(MessageBar);
