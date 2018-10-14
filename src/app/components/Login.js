import React from 'react';
import * as authAction from '../actions/auth';
import configs from '../configs/configs';
import ValidationError from './ValidationError';

export default class Login extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      error: this.props.error,
      validationError: {},
      isValid: true
    };

    this.checkValidityDebouner = null;
  }

  componentDidMount() {
    this.refs.username.focus();
  }

  componentWillReceiveProps(nextProps, PrevProps) {
    if (nextProps.error !== PrevProps.error) {
      this.setState({ error: nextProps.error });
    }
  }

  checkValidity(refName) {
    this.setState({ error: null });
    switch(refName) {
      case 'username':
        if(!this.refs[refName].value) {
          this.setState({ validationError: { username: "Username is required"}, isValid: false });
          return false;
        }

        if(!/^[\w_]+$/.test(this.refs[refName].value)) {
          this.setState({ validationError: { username: "Hmm, that username does not look valid.  Usernames only contain letters, the underscore, or numbers."}, isValid: false });
          return false;
        }
        break;
      case 'password':
        return true;
        break;
      case 'submit':
        if ( !this.checkValidity('username') || !this.checkValidity('password')) {
          return false;
        }
    }

    this.setState({ validationError: {}, isValid: true });
    return true
  }

  clearValidity() {
    if(!this.state.isValid) {
      this.setState({ validationError: {}});
    }
  }

  deboundCheckValidity(refName) {
    if(this.checkValidityDebouner) {
      clearTimeout(this.checkValidityDebouner);
    }
    this.checkValidityDebouner = setTimeout(() => {
      this.checkValidity(refName);
      clearTimeout(this.checkValidityDebouner);
    },500);
  }
  handleSubmit(e) {
    e.stopPropagation();
    clearTimeout(this.checkValidityDebouner);
    if (this.checkValidity('submit')) {
      this.props.dispatch(authAction.postLogIn(this.refs.username.value.trim().toLowerCase(), this.refs.password.value))
    }
    e.preventDefault();
    return false;
  }


  render() {
    const { validationError } = this.state;

    return (
      <div className="login-container">
        <form ref="form">
          <div className="login-field">
            <span className="user-icon icon"> </span>
            <input
              type="text"
              className="user-name"
              placeholder="Username"
              ref="username"
              onBlur={ (e) => {
                this.checkValidity('username')
              }}
              onChange={(e) => {
                this.clearValidity();
                this.deboundCheckValidity('username');
              }} />
            <ValidationError>{validationError.username}</ValidationError>
          </div>
          <div className="login-field">
            <span className="password-icon icon"> </span>
            <input
              type="password"
              className="password"
              placeholder="Password"
              ref="password"
              onBlur={ (e) => { this.checkValidity('password') }}
              onChange={(e) => {
              this.clearValidity();
              this.deboundCheckValidity('password');
            }}/>
            <ValidationError>{validationError.password}</ValidationError>
          </div>
          <div className="row">
            <div className="col-xs-8 col-xs-offset-2">
              <button
                type="submit"
                className="submit"
                disabled={!this.state.isValid}
                onClick={e => this.handleSubmit(e)}>
                Login
              </button>
            </div>
          </div>
          <div className="error">
            {this.state.error}
          </div>
          { this.props.loginPage
            ?
            <div className="password-help-container">
              <a href="https://imyourdoc.com/home/resetPassword">Forgot Password?</a>
              <a href="mailto:support@imyourdoc.com">Need Help?</a>
            </div>
            : false
          }
          { this.props.loginPage
            ?
            <div className="sign-up-container">
              <a href={`${configs.mainSiteUrl}/registration/registration_step1`}>Sign up now!</a>
            </div>
            : false
          }
        </form>
      </div>
    );
  }
}
