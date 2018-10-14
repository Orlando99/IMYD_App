import React from 'react';
import PropTypes from 'prop-types';
import Loader from 'react-loaders';

const LoadingOverlay = ({ type, message }) => (
  <div className="loading-overlay">
    <Loader type={type} />
    <div className="loading-message">{message}</div>
  </div>
);

LoadingOverlay.propTypes = {
  type: PropTypes.string,
  message: PropTypes.string,
};

LoadingOverlay.defaultProps = {
  type: 'ball-spin-fade-loader',
};

export default LoadingOverlay;
