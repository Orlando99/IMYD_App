import 'babel-polyfill';
import React from 'react';
import ReactDom from 'react-dom';
import { Provider } from 'react-redux';
import configureStore from './configs/configureStore';
import { setStore } from './utils/store';
import App from './containers/App';

import '../../node_modules/bootstrap/dist/css/bootstrap.css';
import '../../node_modules/select2/dist/css/select2.css';
import '../stylus/main.styl';

const store = configureStore();
setStore(store);

ReactDom.render(
	<Provider store={store}>
		<App />
	</Provider>,
	document.getElementById('container')
);