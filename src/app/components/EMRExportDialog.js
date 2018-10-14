import React from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import moment from 'moment';
import Dialog from 'material-ui/Dialog';
import AutoComplete from 'material-ui/AutoComplete';
import IconButton from 'material-ui/IconButton';
import RaisedButton from 'material-ui/RaisedButton';
import CircularProgress from 'material-ui/CircularProgress';
import CloseIcon from 'material-ui/svg-icons/navigation/close';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import baseTheme from 'material-ui/styles/baseThemes/lightBaseTheme';
import SelectField from 'material-ui/SelectField';
import * as profileService from '../services/profile';

import restClient from './IMYD-REST-Client';
import { MenuItem } from 'material-ui';

const styles = {
  dialogTitle: {
    padding: '50px 40px 0',
    marginBottom: 15,
  },
  dialogBody: {
    padding: '0 40px 50px',
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  description: {
    marginBottom: 40,
  },
  selectInputContainer: {
    // backgroundColor: '#EDECEC',
    position: 'relative',
  },
  actionContainer: {
    marginTop: 15,
    textAlign: 'right',
  },
  searchLoadingIndicator: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  exportLoadingIndicator: {
    top: 10,
    right: 20,
  },
};

class EMRExportDialog extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      patients: [],
      practices: [],
      searchText: '',
      selectedPatient: null,
      selectedPractice: '',
      searchLoading: false,
      exportLoading: false,
    };
    this.loadSuggestions = _.debounce(this.loadSuggestions, 300);
    this.onSubmit = this.onSubmit.bind(this);
    this.handleUpdateInput = this.handleUpdateInput.bind(this);
    this.handleNewRequest = this.handleNewRequest.bind(this);
    this.onSelectPractice = this.onSelectPractice.bind(this);
    this.loadPractices = _.debounce(this.loadPractices, 300);
  }

  getChildContext() {
    return { muiTheme: getMuiTheme(baseTheme) };
  }

  componentDidMount(){
    profileService.getEmrIntegration().then((results) => {
      if(results.data.emrIntegration === "INTERGY"){
        this.loadPractices();
      }
		}).catch((err) => {
      console.log(err);
		});
  }

  componentWillReceiveProps(newProps) {
    if (!this.props.open && newProps.open) {
      this.setState({
        searchText: '',
        selectedPatient: null,
        searchLoading: false,
        exportLoading: false,
      });
    }
  }

  onSubmit() {
    const { selectedPatient, selectedPractice } = this.state;
    if (selectedPatient) {
      if(selectedPractice){
        this.props.onSubmit(selectedPatient, selectedPractice);
      }else{
        this.props.onSubmit(selectedPatient, selectedPatient.practitionerId);
      }
      this.setState({ exportLoading: true });
    }
  }

  handleUpdateInput(searchText, data, params){
    this.setState({ searchText }, params.source === 'change' ? this.loadSuggestions : null)
  }

  handleNewRequest(chosen, index) {
    if (index === -1) {
      this.setState({ searchText: '', selectedPatient: null });
    } else {
      this.setState({ selectedPatient: chosen });
    }
  }

  loadSuggestions() {
    this.setState({ searchLoading: true });
    let params = {};
    if(this.state.selectedPractice !== ''){
      params = { name: this.state.searchText, practiceId: parseInt(this.state.selectedPractice) };
    }else{
      params = { name: this.state.searchText }
    }
    restClient('GET', `emrintegration/patients`, params)
      .then((results) => {
        const transformedData = (results.data || []).map(p => ({
          ...p,
          text: `${p.firstName} ${p.lastName} ${p.birthDate}`,
        }));
        this.setState({ patients: transformedData });
      })
      .finally(() => this.setState({ searchLoading: false }));
  }

  loadPractices() {
    restClient('GET', `emrintegration/practices`)
      .then((results) => {
        const transformedData = (results.data || []).map(p => ({
          ...p,
        }));
        this.setState({ practices: transformedData });
        if(this.state.practices.length === 1){
          this.setState({ selectedPractice: this.state.practices[0].practiceId });
        }
      })
  }

  onSelectPractice(event, index, value) {
    this.setState({ selectedPractice: value });
  }

  render() {
    const { open, onDismiss } = this.props;
    const { patients, practices, searchText, selectedPatient, selectedPractice, exportLoading, searchLoading } = this.state;
    return (
      <Dialog
        title="Select patient record"
        open={open}
        titleStyle={styles.dialogTitle}
        bodyStyle={styles.dialogBody}
        modal
      >
        <IconButton
          tooltip="Close"
          style={styles.closeButton}
          onClick={onDismiss}
        >
          <CloseIcon />
        </IconButton>
        <div style={styles.description}>
          Transcript will be stored under this patient in the EMR
        </div>
        <div style={styles.selectInputContainer}>
          { practices && practices.length > 1 &&
          <SelectField
            value={selectedPractice}
            onChange={this.onSelectPractice}
            floatingLabelText="Practice">
            {practices.map(x => <MenuItem key={x.practiceId} value={x.practiceId} primaryText={x.practiceName} />)}
          </SelectField>
          }
          <AutoComplete
            hintText="Patient Name"
            searchText={searchText}
            onUpdateInput={this.handleUpdateInput}
            onNewRequest={this.handleNewRequest}
            dataSource={patients}
            dataSourceConfig={{ text: 'text', value: 'patientId' }}
            filter={AutoComplete.caseInsensitiveFilter}
            openOnFocus
            fullWidth
          />
          {searchLoading && <CircularProgress size={25} style={styles.searchLoadingIndicator} />}
        </div>
        {!!selectedPatient &&
          <div style={styles.actionContainer}>
            {exportLoading && <CircularProgress size={30} style={styles.exportLoadingIndicator} />}
            <RaisedButton
              style={styles.actionButton}
              onClick={this.onSubmit}
              label="EXPORT"
              primary
            />
          </div>
        }
       </Dialog>
    );
  }
}

EMRExportDialog.childContextTypes = {
  muiTheme: React.PropTypes.object.isRequired,
};

EMRExportDialog.propTypes = {
  open: PropTypes.bool,
  onSubmit: PropTypes.func,
  onDismiss: PropTypes.func,
}

export default EMRExportDialog;