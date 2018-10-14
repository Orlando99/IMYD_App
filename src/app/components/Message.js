import React from 'react';
import ReactDOM from 'react-dom';
import classnames from 'classnames';
import moment from 'moment';
import $ from 'jquery';
import * as linkify from 'linkifyjs';
import hashtag from 'linkifyjs/plugins/hashtag';
import Linkify from 'linkifyjs/react';
import Avatar from './Avatar';
import * as Utils from '../utils/index';
import { calcUploadTime } from '../utils/messages';
import * as Consts from '../configs/constants';
import MessageTimestamp from './MessageTimestamp';
import { setContextMenu } from '../actions/contextMenu';
import { updateMessageStatus } from '../actions/messages';
import { getRequestUrl } from './../utils/index';
import { fetchMessageFile } from '../services/messages';

hashtag(linkify);

export default class Message extends React.Component {
	constructor(props) {
		super(props);
		this.ackTimeout = null;
		this.handleContextMenu = this.handleContextMenu.bind(this);
		this.handleLoadFile = this.handleLoadFile.bind(this);
	}

	clearTimeout() {
		if (this.ackTimeout) {
			clearTimeout(this.ackTimeout);
		}
		this.ackTimeout = null;
	}

	checkForMessageAcknowledged() {
		const { message } = this.props;
		const minTimeout = 5000;
		this.clearTimeout();
		if (message.currentUser && message.delivery && !(Consts.ACKNOWLEDGED in message.delivery) ) {
			const timeout = !message.file ? minTimeout : calcUploadTime(message.fileSize);
			this.ackTimeout = setTimeout(() => {
				this.clearTimeout();
				if ( !(Consts.ACKNOWLEDGED in message.delivery) ) {
					this.props.dispatch(updateMessageStatus(message, Consts.SENDING_FAILED));
					// this.setState({ message: addStatus(message, Consts.SENDING_FAILED) });
				}
			},timeout);
		}
	}

	componentDidMount() {
		this.checkForMessageAcknowledged();
	}

	handleResend(event, message) {
		event.preventDefault();
		event.stopPropagation();
		this.props.dispatch(updateMessageStatus(message, Consts.RETRY));
		this.props.resendMessage({
			messageId: message.messageId,
			text: message.text,
			threadID: message.threadID
		});
		this.checkForMessageAcknowledged();

		return false;
	}


	handleContextMenu(event) {
		event.preventDefault();

		const contextMenu = {
			name: 'message',
			data: this.props,
			width: 75,
			height: 65,
			top: event.clientY,
			left: event.clientX,
			show: true
		};

		this.props.dispatch(setContextMenu(contextMenu))
	}

  handleLoadFile(event) {
    if (this.props.message.error) {
      alert(this.props.message.error);
      event.preventDefault();
      event.stopPropagation();
      return false;
    }

    // console.log(this.props.message);

    // existing means it was uploaded in a previous sesssion
    const existingFile = this.props.message.filePath ? this.props.message.filePath.indexOf('blob') < 0 : true;

    if(existingFile && this.props.message.file) {
      const filePathComponents = this.props.message.filePath.split('/'),
        messageId = this.props.message.messageId,
        fileName = filePathComponents.pop(),
        url = getRequestUrl(`/api/v1/attachments/${messageId}/${fileName}`);

			let iWindow = window.open(url, '_blank');
			// If the window fails, assume popups are blocked and download the file instead.
			if(!iWindow) {
				console.warn('Your popups are being blocked, if you want to open these attachments in a new browser tab, please verify that popups are allowed.');
				let link = document.createElement('a');
				link.href = url;
				link.download = fileName;
				link.dispatchEvent(new MouseEvent('click'));
			}
			return false;
    } else if(!existingFile) {
      // blob:https://serverUrl/61af1965-e9be-4383-a1d2-fd4af52b9dfa
      window.open(this.props.message.filePath, "_blank");
		} else {
			alert("This file could not be opened.");
			event.preventDefault();
			event.stopPropagation();
			return false;
		}
  }

	handleMouseOver(toolTip) {
		return (event) => {
			ReactDOM.render(
				<table className="tooltip">
					<thead>
						<tr>
							<th>Recipient</th>
							<th>Status</th>
						</tr>
					</thead>
					<tbody>
						{toolTip}
					</tbody>
				</table>,
				document.querySelector('#regular-modals'));
			const offset = $(event.target).offset();
			const $tooltip = $('.tooltip');
			$tooltip.css({
				top: (offset.top + 20) + 'px',
				left: (offset.left - 100) + 'px'
			});

			if (!Utils.checkNodeVisibility($tooltip[0])) {
				$tooltip.css({
					top: (offset.top - $tooltip.height()) + 'px',
					left: (offset.left - 100) + 'px'
				});
			}
		};
	}

	handleMouseOut(event) {
		$('.tooltip').remove();
	}

	render() {
		const { message, selectable, selected, onToggleSelect } = this.props;
		const isGroup = message.type === Consts.ROOM;

		let containerClassName = classnames({
			'is-current-user': message.currentUser,
			'jump-to-message': this.props.jumpToMessage,
			selected: selectable && selected,
		}, 'message-container');

		const messageClassName = classnames({
			'left': !message.currentUser,
			'right': message.currentUser
		}, 'message');

		let messageContent;
		if (message.file) {
			const fileStyle = {};
			const fileType = message.fileType.toLowerCase();

      if (fileType === Consts.IMAGE && !message.fileLoading) {
				if (message.text) {
					fileStyle.backgroundImage = `url("data:${message.mimeType};base64,${ message.text }")`;
				}
				else {
					fileStyle.backgroundImage = 'url("' + message.filePath + '")';
				}
			}

			const fileClassName = classnames({
				loading: message.fileLoading,
				error: message.error != null
			}, 'file');

      messageContent = (
				<div className="content">
					<div
						style={{cursor: 'pointer'}}
						onClick={this.handleLoadFile}
						key={message.messageId}
					>
						<div
							className={fileClassName + ' ' + fileType}
							style={fileStyle}
							title={message.fileName}>
						</div>
					</div>
				</div>
      );
		}
		else if (message.error) {
			messageContent = (
				<div className="content error" title={message.error} onClick={() => alert(message.error)}>{message.text}</div>
			);
		}
		else {
			messageContent = <div className="content">
				<Linkify>{message.text}</Linkify>
			</div>;
		}

		let sender = false;
		if ( isGroup && !message.currentUser ) {
			sender = <span className="sender"> {message.contact.name}</span>
		}
		let content = null;
		if ( message.isExternal ) {
			content = (
				<div>
					<Avatar name={message.contact.username} large={true} />
					<div className="message-wrap">
						<div className={messageClassName}>
							{messageContent}
							<div className="footer">
								<MessageTimestamp timestamp={message.timestamp} />
								<div className="clearfix"></div>
							</div>
						</div>
					</div>
				</div>
			);
		} else {
			content = (
				<div onContextMenu={this.handleContextMenu}>
					<Avatar
						name={message.contact.username}
						image={Utils.getContactAvatarUrl( Utils.hasAvatar(message.contact) )}
						large={true} />

					<div className="message-wrap">
						<div className={messageClassName}>
							{messageContent}
							<div className="footer">
								<MessageTimestamp timestamp={message.timestamp} />
								<div className="clearfix"></div>
							</div>
						</div>
						{sender}
					</div>
				</div>
			);
		}


		let messageStatus;
		if (message.currentUser) {
			if (message.delivery) {

				if ( (Consts.ACKNOWLEDGED in message.delivery && this.ackTimeout) ) {
					this.clearTimeout();
				}

				if (message.type === Consts.ROOM) {

					let lookup = {};

					Object.keys(message.delivery).map((key) => {
						if (message.delivery[key]) {
							message.delivery[key].type = key;
						}

						return message.delivery[key] || [];
					}).forEach((status) => {
						status.forEach((item) => {
							if (item.username && item.username !== this.props.user.username) {
								lookup[item.username] = lookup[item.username] || {};
								lookup[item.username][status.type] = message.users[item.username] || item.username;
							}
						});
					});

					Object.keys(message.users).forEach((username) => {
						if (!lookup[username]) {
							lookup[username] = { blah: username };
						}
					});

					let readCount = 0;
					let sentCount = 0;
					let totalCount = 0;
					const toolTip = Object.keys(lookup).map((key) => {
						totalCount++;
						return lookup[key];
					})
					.map((statuses, index) => {
						let status = '';
						let name = statuses[Object.keys(statuses)[0]];
						if (Consts.SENDING in statuses) {
							status = 'Sending';
						}
						if (Consts.ACKNOWLEDGED in statuses) {
							sentCount++;
							status = 'Sent';
						}
						if (Consts.NOTIFIED in statuses) {
							sentCount++;
							status = 'Notified';
						}
						if (Consts.DELIVERED in statuses) {
							sentCount++;
							status = 'Delivered';
						}
						if (Consts.DISPLAYED in statuses) {
							sentCount++;
							readCount++;
							status = 'Read';
						}
						if (!status) {
							sentCount++;
							status = 'Sent'
						}

						return (
							<tr key={index} className="statusRow">
								<td className="name">{name}</td>
								<td className="status">{status}</td>
							</tr>
						);
					});

					const mouseOver = this.handleMouseOver(toolTip).bind(this);
					let messageStat = 'Sending';

					if (Consts.RETRY in message.delivery) {
						messageStat = <span>Retry</span>;
					}
					if (Consts.SENDING_FAILED in message.delivery) {
						messageStat = <span className="sending-failed">
							<span >Sending Failed</span>
							<span className="read-more"
										onClick={(e) => this.handleResend(e, message)}
										title="Resend message"/>
						</span>;
					}

					if (readCount || sentCount) {
						if (readCount && readCount === totalCount) {
							messageStat = <span>Read</span>;
						}
						else {
							messageStat = <span><span >Sent</span><span className="read-more"/></span> ;
						}
					}

					messageStatus = (
						<div
							className="status right"
							onMouseOver={mouseOver}
							onMouseLeave={this.handleMouseOut}>
							{messageStat}
						</div>
					);
				}
				else {
					let status = 'Sending';
					if (Consts.RETRY in message.delivery) {
						status = 'Retry';
					}
					if (Consts.SENDING_FAILED in message.delivery) {
						status = <span className="sending-failed">
							<span >Sending Failed</span>
							<span className="read-more"
										onClick={(e) => this.handleResend(e, message)}
										title="Resend message"/>
						</span>;
					}
					if (Consts.ACKNOWLEDGED in message.delivery) {
						status = 'Sent';
					}
					if (Consts.NOTIFIED in message.delivery) {
						status = 'Notified';
					}
					if (Consts.DELIVERED in message.delivery) {
						status = 'Delivered';
					}
					if (Consts.DISPLAYED in message.delivery) {
						status = 'Read';
					}

					messageStatus = (
						<div className="status right">
							{status}
						</div>
					);
				}
			}

			content = (
				<div onContextMenu={ (event) => { this.handleContextMenu(event) } }>
					<div className="message-wrap">
						<div className={messageClassName}>
							{messageContent}
							<div className="footer">
								<MessageTimestamp timestamp={message.timestamp} />
								<div className="clearfix"></div>
							</div>
						</div>
						{messageStatus}
					</div>
					<Avatar
						isMe={true}
						name={message.contact.username}
						large={true} />
				</div>
			);
		}
		else {
			containerClassName += ' sent';
		}

		const checkbox = (selectable &&
			<label className="checkbox">
				<input
					type="checkbox"
					checked={selected}
					onChange={() => onToggleSelect(message.messageId)}
				/>
				<span className="checkmark"></span>
			</label>
		);

		return (
			<div
				className={containerClassName}
				data-is-read={!!message.isRead}
				data-message-id={message.messageId}
			>
				{!message.currentUser && checkbox}
				{content}
				{message.currentUser && checkbox}
			</div>
		);
	}
}