import React from 'react';
import classnames from 'classnames';
import { connect } from 'react-redux'

class Avatar extends React.Component {

  render() {
    let initials = '';
    let style = {};
    if (this.props.image || ( this.props.photoUrl && this.props.isMe )) {
      style.backgroundImage = 'url("' + (this.props.image || this.props.photoUrl) + '")';
      style.backgroundSize = 'cover';
    }
    else {
      initials = '?';
      if (this.props.name) {
        let name = this.props.name.trim().split(/\s+/g);
        initials = name[0][0];
        if (name.length > 1) {
          initials += name[name.length - 1][0];
        }
        initials = initials.toUpperCase();
      }
    }

    let upperRightCount = '';
    if (this.props.upperRightCount != null) {
      upperRightCount = (
        <span className="upper-right-count">
          {this.props.upperRightCount}
        </span>
      );
    }

    const className = classnames({'large': this.props.large}, 'Avatar');
    return (
      <div className={className} style={style} title={this.props.name}>
        {initials}
        {upperRightCount}
      </div>
    );
  }
}

function select({ auth = {}}) {
  const photoUrl = auth && auth.user && auth.user.photoUrl || '';
  return {photoUrl};
}

export default connect(select)(Avatar);