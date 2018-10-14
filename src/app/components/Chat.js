import React from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import $ from 'jquery'
import classnames from 'classnames';
import moment from 'moment';
import _ from 'lodash';
import FileSaver from 'file-saver';
import { parse as json2csv } from 'json2csv';

import Avatar from './Avatar';
import Message from './Message';
import MessageBar from './MessageBar';
import LoadingOverlay from './LoadingOverlay';
import * as Utils from '../utils/index';
import * as Consts from '../configs/constants';
import * as generalAction from '../actions/general';
import * as authAction from '../actions/auth';
import EMRExportDialog from './EMRExportDialog';
import { CREATE } from 'admin-on-rest';
import restClient from './IMYD-REST-Client';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import baseTheme from 'material-ui/styles/baseThemes/lightBaseTheme';
import Snackbar from 'material-ui/Snackbar';

class Chat extends React.Component {

	constructor(props) {
		super(props);

		this.markReadInterval = null;
		this.currentScrollTop = null;
		this.prevScrollHeight = null;

		this._addNewMessage = this._addNewMessage.bind(this);
		// this._markMessagesAsRead = _.debounce(this._markMessagesAsRead.bind(this), 300,
		// 	{ leading: true, trailing: true });
		this.onMessagesLoadedOrUpdated = this.onMessagesLoadedOrUpdated.bind(this);
		this.toggleExportButtons = this.toggleExportButtons.bind(this);
		this.onToggleAllSelection = this.onToggleAllSelection.bind(this);
		this.onToggleSelectMessage = this.onToggleSelectMessage.bind(this);
		this.exportMessages = this.exportMessages.bind(this);
		this.exportText = this.exportText.bind(this);
		this.exportCSV = this.exportCSV.bind(this);
		this.exportPDF = this.exportPDF.bind(this);
		this.exportEMR = this.exportEMR.bind(this);
		this.toggleEMRExportDialog = this.toggleEMRExportDialog.bind(this);
		this.handleEMRExportResultToastClose = this.handleEMRExportResultToastClose.bind(this);
		this.state = {
			showExport: false,
			allSelected: false,
			selectedMessages: [],
			pendingExportOption: null,
			emrExportDialogOpen: false,
			emrExportResultToastOpen: false,
			emrExportResultToastMessage: '',
		};
	}

	getChildContext() {
    return { muiTheme: getMuiTheme(baseTheme) };
  }

	componentWillReceiveProps(nextProps) {
		// const $messagesContainer = this.getContainer();
		// const firstMessage = this.state.messages && this.state.messages[0];
		// const newFirstMessage = props.messages && props.messages[0];
		const isNewThread = this.props.threadID !== nextProps.threadID;

		if (isNewThread) {
			this.setState({ allSelected: false, selectedMessages: [] });
		}

		if (isNewThread ||
			(this.props.messages.length > 0 && nextProps.messages.length > 0 &&
				_.last(this.props.messages).messageId !== _.last(nextProps.messages).messageId)) {
			this.currentScrollTop = null;
		}

		if(this.isAFetchUpdate(this.props, nextProps)) {
			const $messagesContainer = this.getContainer();
			this.prevScrollHeight = $messagesContainer[0].scrollHeight;
		}
		if (this.props.fetching && !nextProps.fetching && !!this.state.pendingExportOption) {
			const { pendingExportOption } = this.state;
			this.setState({
				pendingExportOption: null,
				selectedMessages: nextProps.messages.map(m => m.messageId),
			}, () => setTimeout(() => {
				this.exportMessages(pendingExportOption)();
			}, 100));
		}
	}

	componentDidMount() {
		let interval = setInterval(() => {
			this.props.dispatch(generalAction.pingCurrentTime(Date.now()));
		}, 30000);

		const $messagesContainer = this.getContainer();
		$messagesContainer.on('scroll', this._handleScroll.bind(this));
		// this.onMessagesLoadedOrUpdated();
	}

	componentDidUpdate(prevProps, prevState) {
		if (this.isAFetchUpdate(prevProps, this.props)) {
			this.onMessagesLoadedOrUpdated();
		}
	}

	onMessagesLoadedOrUpdated() {
		// console.log('updating scroll on didupdate');
		this._scrollToEndOrPreviousScroll();
		const timeout = this.props.justLoggedIn ? 5000 : 2000;

		if (this.markReadInterval) {
			clearInterval(this.markReadInterval);
		}
		this.markReadInterval = setInterval(() => {
			if (!Utils.pageIsHidden()) {
				this._markMessagesAsRead();
				if (this.props.justLoggedIn) {
					this.props.dispatch(authAction.updateJustLoggedIn(false));
				}
				clearInterval(this.markReadInterval);
			}
		}, timeout);

		const search = this.props.search;
		if ( search.jumpToMessageID && this.refs[search.jumpToMessageID] ) {
			const messageNode = ReactDOM.findDOMNode(this.refs[search.jumpToMessageID]);
			messageNode && messageNode.scrollIntoView();
		}
	}

	isAFetchUpdate(currentProp, nextProps) {
		return (currentProp.threadID !== nextProps.threadID ||
			currentProp.fetching !== nextProps.fetching ||
			nextProps.messages.length !== currentProp.messages.length ||
			!_.isEqual(currentProp.typing, nextProps.typing)
			// && currentProp.page !== nextProps.page
		);
	}

	getContainer() {
		const node = ReactDOM.findDOMNode(this);
		return $(node).find('.messages-container');
	}

	_markMessagesAsRead() {
		if (!this.isMarkingInProgress) {
			this.isMarkingInProgress = true;
			
			const $messagesContainer = this.getContainer();
			const { scrollTop, scrollHeight, clientHeight } = $messagesContainer[0];
			const messages = this.props.messages || [];
			const visibleStart = _.findIndex(messages, m => {
				const domNode = ReactDOM.findDOMNode(this.refs[m.messageId]);
				return domNode && domNode.offsetTop >= scrollTop;
			});
			if (visibleStart > -1) {
				// const visibleEnd = _.findIndex(messages.slice(visibleStart), m => !!m.isRead);
				messages.slice(visibleStart).forEach(msg => {
					if (!msg.currentUser && !msg.isRead) {
						// console.log('***marking message as read: ', msg);
						this.props.messageIsRead(msg);
					}
				});
			}
			this.isMarkingInProgress = false;
		}
	}

	_handleScroll(event) {
		const $messagesContainer = this.getContainer();
		const { scrollTop, scrollHeight, clientHeight } = $messagesContainer[0];
		if (this.currentScrollTop && scrollTop < this.currentScrollTop) {
			this._markMessagesAsRead();
		}
		this.currentScrollTop = scrollTop <= (scrollHeight - clientHeight - 20) ? scrollTop : null;
		if (scrollTop === 0 && !this.props.last) {
			this.props.fetchNewPage(this.props.page + 1, this.props.pageSize);
		}
	}

	_scrollToEndOrPreviousScroll() {
		const $messagesContainer = this.getContainer();
		const $messagesContainerNode = $messagesContainer[0];
		if(this.prevScrollHeight !== null && this.currentScrollTop !== null) {
			this.currentScrollTop = this.currentScrollTop + ($messagesContainerNode.scrollHeight
				- this.prevScrollHeight);
			this.prevScrollHeight = null;
		}
		$messagesContainerNode.scrollTop = this.currentScrollTop ||
			($messagesContainerNode.scrollHeight - $messagesContainerNode.clientHeight);
	}
	
	_addNewMessage(msg) {
		this._markMessagesAsRead();
		this.props.addMessage(msg);
	}

	onToggleAllSelection(e) {
		this.setState({
			allSelected: e.target.checked,
			selectedMessages: e.target.checked ? this.props.messages.map(m => m.messageId) : [],
		});
	}

	onToggleSelectMessage(msgId) {
		this.setState({ selectedMessages: _.xor(this.state.selectedMessages, [msgId]) });
	}

	toggleExportButtons() {
		this.setState({ showExport: !this.state.showExport });
	}

	exportMessages(type) {
		return () => {
			if (this.state.allSelected && !this.props.last && this.props.messages.length < 1000) {
				this.props.fetchNewPage(0, 1000);
				this.setState({ pendingExportOption: type });
			} else {
				if (!this.props.last && this.props.messages.length >= 1000) {
					this.props.setFeedback({
						feedbackType: 'warning',
						message: 'Warning: export is limited to 1,000 messages a time. The most recent 1,000 messages will be exported.',
						show: true
					});
					setTimeout(() => this.props.setFeedback({
						feedbackType: 'close',
						message: '',
						show: false,
					}), 3000);
				}
				switch (type) {
					case 'text':
						return this.exportText();
					case 'csv':
						return this.exportCSV();
					case 'pdf':
						return this.exportPDF();
				}
			}
		};
	}

	toggleEMRExportDialog(){
		this.setState({ emrExportDialogOpen: !this.state.emrExportDialogOpen })
	}

	handleEMRExportResultToastClose(){	
		this.setState({ emrExportResultToastOpen: false })
	}

	exportEMR(patient, practitionerOrPracticeId) {
		const { selectedMessages, allSelected } = this.state;
		if (patient) {
		  const { patientId } = patient;
		  // console.log('message props: ', this.props);
		  const exportData = { patientId, threadName: this.props.threadID };
		  exportData.threadName = this.props.threadID;
		  // if (!allSelected) {
			// 	exportData.messageIds = (this.props.state.record || []).filter((m, i) =>
			//   	selectedMessages.includes(`${m.timestamp}-${i}`)).map(m => m.messageId);
			// }
			exportData.practitionerOrPracticeId = practitionerOrPracticeId;
			exportData.messageIds = selectedMessages;
		  console.log('export data: ', exportData);
		  restClient(CREATE, 'emrintegration/export', { data: exportData })
			.then(result => {
			  this.setState({
				emrExportDialogOpen: false,
				emrExportResultToastOpen: true,
				emrExportResultToastMessage: `Transcript saved to chart of ${patient.text}.`,
			  });
			});
		} else {
		  this.setState({ emrExportDialogOpen: false });
		}
	}

	exportText() {
		const { messages, thread, participants } = this.props;
		const { selectedMessages } = this.state;
		// console.log('messages: ', messages, thread, participants);
    let updatedMessages = [], title, titleSet = false;
    messages.forEach((message, index) => {
      if (!titleSet) {
        title = thread.type === 'ONE_TO_ONE' ? `Conversation with ${participants[0].name || participants[0].username}` :
          `Group Conversation: ${thread.naturalName || ``}`;
        updatedMessages.push(title);
        titleSet = true;
      }

      if (selectedMessages.indexOf(message.messageId) >= 0) {
        const timestamp = moment(message.timestamp, 'YYYY-MM-DD HH:mm:ss Z').format(Consts.IMYD_DATETIME_FORMAT);
        updatedMessages.push(`${message.sender.username} (${timestamp}): ${message.text}`);
      }
    });
    const text = updatedMessages.join('\n');
    const textBlob = new Blob([text], { type: 'text/plain' });
    if (window.navigator && window.navigator.msSaveOrOpenBlob) {
      window.navigator.msSaveOrOpenBlob(textBlob);
    }
    else {
      const textFile = window.URL.createObjectURL(textBlob);
      window.open(textFile, '_blank');
    }
	}
	
	exportCSV() {
		const { messages, thread, participants } = this.props;
		const { selectedMessages } = this.state;
    let updatedMessages = [], title, titleSet = false;
    messages.forEach((message, index) => {
      if (!titleSet) {
        title = thread.type === 'ONE_TO_ONE' ? `Conversation with ${participants[0].name || participants[0].username}` :
          `Group Conversation: ${thread.naturalName || ``}`;
        titleSet = true;
      }

      if (selectedMessages.indexOf(message.messageId) >= 0) {
        let timestamp = moment(message.timestamp, 'YYYY-MM-DD HH:mm:ss Z').format(Consts.IMYD_DATETIME_FORMAT);
        updatedMessages.push({
					Sender: message.sender.username,
					Message_Text: message.text,
					Date: timestamp,
				});
      }
    });
    let csv = json2csv(updatedMessages, { fields: ['Sender', 'Message_Text', 'Date'] });
    var csvBlob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    FileSaver.saveAs(csvBlob, `${title}.csv`);
	}

	exportPDF() {
		const maxLines = 48;
		const { messages, thread, participants, user: { username } } = this.props;
		const { selectedMessages } = this.state;

    let
      title = 'IMYD_pdf',
      y = 10,
      doc = new window.jsPDF(),
      numLines = 1,
      previousParagraphSize = 1,
      x = 10,
      currentPage = 1,
      documentObject = [],
      titleSet = false;

    messages.forEach((message, index) => {
      const myUser = username === message.sender.username;
      let splitMessage, messageHeight;

      if (numLines >= maxLines) {
        currentPage++;
        numLines = 1;
        y = 10;
      }

      if (myUser) {
        x = 60;
      } else {
        x = 10
      }

      if (previousParagraphSize > 1) {
        y += 4 * previousParagraphSize;
      }

      if (selectedMessages.indexOf(message.messageId) >= 0) {
        if (!(message.text.length > 1000 && message.text.indexOf(' ') < 0)) {

          if(!titleSet) {
            title = thread.type === 'ONE_TO_ONE' ? `Conversation with ${participants[0].name || participants[0].username}` :
          		`Group Conversation: ${thread.naturalName || ``}`;

            let messageHeight = 1;

            // Add message object for text here
            documentObject.push({
              myUser,
              payload: title,
              type: 'title',
              x,
              y,
              width: 140,
              height: messageHeight,
              xRadius: 2,
              yRadius: 2,
              style: 'F',
              pageNumber: currentPage,
              meta: '',
            });
            y += 8;
            titleSet = true;
          }

					const meta = `${moment(message.timestamp, 'YYYY-MM-DD HH:mm:ss Z')
						.format(Consts.IMYD_DATETIME_FORMAT)}, ${message.sender.username}`;
          splitMessage = doc.splitTextToSize(message.text, 210);
          messageHeight = splitMessage.length * 6;

          // Add message object for text here
          documentObject.push({
            myUser,
            payload: splitMessage,
            type: 'text',
            x,
            y,
            width: 140,
            height: messageHeight,
            xRadius: 2,
            yRadius: 2,
            style: 'F',
            pageNumber: currentPage,
            meta,
          });

          y += 10;
          numLines += splitMessage.length + 1;
          previousParagraphSize = splitMessage.length;
        } else {
					const meta = `${moment(message.timestamp, 'YYYY-MM-DD HH:mm:ss Z')
						.format(Consts.IMYD_DATETIME_FORMAT)}, ${message.sender.username}`;

          // console.log('Image:',message.text);
          const encoding = message.text.slice(0, 4);
          let type = '', canRender = false;
          switch (encoding) {
            case "/9j/":
              type = 'JPEG';
              canRender = true;
              break;
            case 'iVBO':
              type = 'PNG';
              canRender = true;
              break;
            default:
              type = 'JPEG';
              canRender = true;
              break;
          }

          if (canRender) {
            let myImage = new Image();
            myImage.src = `data:image/${type};base64,${message.text.toString()}`;
            myImage.width = 130;

            if (numLines <= 20) {
              myImage.coordinates = {x: x, y: y};
              myImage.currentPage = currentPage;
              numLines += 11;
              y += 84;
            } else {
              currentPage++;
              numLines = 1;
              y = 10;
              myImage.coordinates = {x: x, y: y};
              myImage.currentPage = currentPage;
              numLines += 11;
              y += 84;
            }

            myImage.onload = function (event) {
              // Add message object for image here
              const ratio = this.naturalHeight / this.naturalWidth;
              documentObject.push({
                myUser,
                payload: myImage.src,
                type,
                x: this.coordinates.x,
                y: this.coordinates.y,
                width: Math.round(80 / ratio),
                height: 80,
                xRadius: 2,
                yRadius: 2,
                style: null,
                pageNumber: this.currentPage,
                meta,
              });
            };
          }
        }
      }
		});

    setTimeout(() => {

      // Start processing the documentObject into a PDF
      doc.setFontSize(10);

      let pages = [1];
      documentObject.forEach((message) => {
        // New page found, add a page
        if (_.indexOf(pages, message.pageNumber) < 0) {
          pages.push(message.pageNumber);
          doc.addPage();
        }

        if(message.type === 'title') {
          doc.setFontSize(18);
          doc.setPage(message.pageNumber);
          doc.setFillColor(255, 255, 255);
          doc.roundedRect(message.x, message.y, 140, message.height, 1, 1, 'F');
          doc.setTextColor(0, 0, 0);
          doc.text(message.payload, message.x + 2, message.y + 3.2, null);
        }
        else if (message.type === 'text') {
          doc.setFontSize(10);
          doc.setPage(message.pageNumber);
          if (message.myUser) {
            doc.setFillColor(156, 205, 33);
          } else {
            doc.setFillColor(80, 80, 80);
          }
          doc.roundedRect(message.x, message.y, 140, message.height, 1, 1, 'F');
          doc.setTextColor(255, 255, 255);
          doc.text(message.payload, message.x + 2, message.y + 3.2 + message.payload.length, null);

          // To add URLs
          // doc.textWithLink('Click here', message.x + 2, message.y + 3.2 + message.payload.length, { url: 'http://www.google.com' });

          doc.setTextColor(0, 0, 0);
          doc.setFontSize(7);
          doc.text(message.meta, message.x + 2, message.y + 1.5 + message.payload.length + message.height, null);
        } else {
          // console.log('image:', message.x + 2, message.y, message.width, message.height, message.payload);
          doc.setPage(message.pageNumber);
          if (message.myUser) {
            doc.setFillColor(156, 205, 33);
          } else {
            doc.setFillColor(80, 80, 80);
          }
          doc.roundedRect(message.x, message.y - 1, message.width + 4, 82, 1, 1, 'F');
          doc.addImage(message.payload, message.type, message.x + 2, message.y, message.width, message.height - 1);
          doc.setTextColor(0, 0, 0);
          doc.setFontSize(7);
          doc.text(message.meta, message.x + 2, message.y + 83, null);
        }
      });
      // console.log(doc.output());
      doc.save(`${title}.pdf`);
    }, 1000);
	}

	render() {

		const {
			participants, messages, typing, fetching, thread, tempThread, search = {}, addFile, threadID,
		} = this.props;

		let _thread = thread;
		let _messages = messages;
		let _participants = participants;
		// added this incase we need to use a temporary thread.
		if ( tempThread ) {
			_thread = tempThread;
			_messages = tempThread.messages;
			_participants = tempThread.participants;
		}

		let currentDate;
		let from;
		let typingBlock;
		const isGroup = _thread.type === Consts.ROOM;

		if (_participants && _participants.length) {
			const name = isGroup ? _thread.naturalName : _participants[0].name;
			const hasPatient = _participants.some(user => user.userType === Consts.PATIENT);
			let image;
			if (isGroup) {
				if (hasPatient) {
					image = '/images/red_group_profile.png';
				}
				else {
					image = '/images/green_group_profile.png';
				}
			}
			else {
				image = Utils.getContactAvatarUrl(Utils.hasAvatar(_participants[0]));
			}
			const title = isGroup ? 'Group' : _participants[0].jobTitle;
			const className = classnames({
				'is-group': isGroup,
				'has-patient': hasPatient
			}, 'from');

			from = (
				<div className={className} title={_thread.participants.map(user => user.name || user.username).join(', ')}>
					<Avatar
						name={name}
						image={image}
						large={true} />
					<div className="who">
						<div className="name">{name}</div>
						<div className="title">{title || '--'}</div>
					</div>
				</div>
			);
		}

		let fetchingBlock;
		if (fetching && !tempThread) {
			fetchingBlock = <div className="timestamp">Fetching messages...</div>;
		}

		let lastDate;
		const messagesContainerContent = [];
		const today = moment();

		if (_messages && _messages.length) {
			_messages.forEach((message, index) => {

				if ( search.searchedMessagesID && search.searchedMessagesID.length && !message.isSearchResult) {
					return;
				}

				const messageDate = Utils.getMomentFromTimestamp(message.timestamp);
				if (!lastDate || messageDate.month() !== lastDate.month() || messageDate.date() !== lastDate.date()) {
					lastDate = messageDate;
					let formattedDate = lastDate.format('dddd, MMMM Do YYYY');
					if (lastDate.month() === today.month() && lastDate.date() === today.date()) {
						formattedDate = 'Today';
					}
					messagesContainerContent.push(<div key={index + 'timestamp'} className="timestamp">{formattedDate}</div>);
				}
				let jumpToMessage = false;
				if ( search.jumpToMessageID === message.messageId ) {
					jumpToMessage = true;
				}
				messagesContainerContent.push((
					<Message
						key={message.messageId}
						ref={message.messageId}
						jumpToMessage={jumpToMessage}
						message={message}
						user={this.props.user}
						rooms={this.props.rooms}
						contacts={this.props.contacts}
						selectable={this.state.showExport}
						selected={this.state.selectedMessages.includes(message.messageId)}
						dispatch={this.props.dispatch}
						resendMessage={this.props.resendMessage}
						onToggleSelect={this.onToggleSelectMessage}
					/>
				));
			});
		}

		if (typing && typing.length) {
			let who;
			if (isGroup) {
				who = (
					<span className="who">{typing.join(', ')} { typing.length > 1 ? 'are' : 'is' } typing</span>
				);
			}
			typingBlock = (
				<div className="left typingContainer">
					<div className="typing" title={typing}>
						<span className="glyphicon glyphicon-option-horizontal">
						</span>
					</div>
					{who}
				</div>
			);
		}

		const { showExport, allSelected, selectedMessages, pendingExportOption } = this.state;

		return (
			<div className="chat-container">
				{from}
				{!!pendingExportOption && <LoadingOverlay message="Loading more messages..." />}
				{showExport &&
					<div className="checkbox-container">
						<label className="checkbox">Select All Messages
							<input type="checkbox" checked={allSelected} onChange={this.onToggleAllSelection} />
							<span className="checkmark"></span>
						</label>
					</div>
				}
				<div className={classnames('messages-container', { 'export-visible': showExport })}>
					{fetchingBlock}
					{messagesContainerContent}
					{typingBlock}
				</div>
				{
					tempThread
						? null
						:
						<MessageBar
							search={this.props.search}
							addMessage={this._addNewMessage}
							addFile={addFile}
							threadID={threadID}
							thread={_thread}
							participants={_participants}
							exportVisible={showExport}
							selectedMessageCount={selectedMessages.length}
							inputBuffer={this.props.inputBuffer}
							onTypeStart={this.props.onTypeStart}
							onTypeStop={this.props.onTypeStop}
							onToggleExport={this.toggleExportButtons}
							exportMessages={this.exportMessages}
							toggleEMRExportDialog={this.toggleEMRExportDialog}
							user={this.props.user}
						/>
				}
				{this.state.emrExportDialogOpen &&
					<EMRExportDialog
					open={this.state.emrExportDialogOpen}
					onSubmit={this.exportEMR}
					onDismiss={this.toggleEMRExportDialog}
					/>
				}
				<Snackbar
					open={this.state.emrExportResultToastOpen}
					message={this.state.emrExportResultToastMessage}
					action="DISMISS"
					autoHideDuration={4000}
					onRequestClose={this.handleEMRExportResultToastClose}
				/>
			</div>
		);
	}
}

Chat.childContextTypes = {
  muiTheme: React.PropTypes.object.isRequired,
};

Chat.propTypes = {
	messages: PropTypes.array,
};

Chat.defaultProps = {
	messages: [],
};

export default Chat;