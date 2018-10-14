// in src/IMYD-REST-Client.js
import _ from 'lodash';
import {
  GET_LIST,
  GET_ONE,
  GET_MANY,
  GET_MANY_REFERENCE,
  CREATE,
  UPDATE,
  DELETE,
  fetchUtils,
  showNotification,
} from 'admin-on-rest';
import moment from 'moment';
import Cookies from 'js-cookie';
import configs from '../js/configs';
import Utility from "../js/utilities";

const API_URL = `${configs.apiAdminUrl}/api/v1`;
const API_URL_CHAT = `${configs.apiUrl}/api/v1`;

/**
 * @param {String} type One of the constants appearing at the top if this file, e.g. 'UPDATE'
 * @param {String} resource Name of the resource to fetch, e.g. 'posts'
 * @param {Object} params The REST request params, depending on the type
 * @returns {Object} { url, options } The HTTP request parameters
 */
const convertRESTRequestToHTTP = (type, resource, params) => {
  let url = '';
  const {queryParameters} = fetchUtils;
  const options = {};
  // console.log('request data: ', type, resource, params);

  switch (type) {
    case 'GET_USER': {

      url = `${API_URL_CHAT}/${resource}`;
      break;
    }
    case 'GET_SETTINGS': {

      url = `${API_URL_CHAT}/${resource}`;
      break;
    }
    case 'UPDATE_SETTINGS': {

      url = `${API_URL_CHAT}/${resource}`;
      options.method = 'PATCH';
      options.body = JSON.stringify(params);
      break;
    }
    case 'GET': {
      const query = params;

      url = `${API_URL_CHAT}/${resource}?${queryParameters(query)}`;
      break;
    }
    case 'POST': {
      url = `${API_URL_CHAT}/${resource}`;
      options.method = 'POST';
      options.body = JSON.stringify(params.data);
      break;
    }
    case 'ADD_TO_ORG_ROSTER': {
      const {username, orgUsersToAdd} = params;
      let queryString = `username=${username}&`;
      if (orgUsersToAdd) {
        queryString += `orgUsersToAdd=${orgUsersToAdd}&`;
      }

      url = `${API_URL_CHAT}/${resource}?${queryString}`;
      options.method = 'POST';
      break;
    }
    case 'ADD_TO_ROSTER': {
      const {username, contacts} = params;
      let queryString = `username=${username}&`;
      contacts.forEach((contact) => {
        if (contact) {
          queryString += `usersToAdd=${contact}&`;
        }
      });

      url = `${API_URL_CHAT}/${resource}?${queryString}`;
      options.method = 'POST';
      break;
    }
    case 'REMOVE_FROM_ROSTER': {
      const {username, userToRemove} = params;
      let queryString = `username=${username}&`;
      if (userToRemove) {
        queryString += `userToRemove=${userToRemove}`;
      }

      url = `${API_URL_CHAT}/${resource}?${queryString}`;
      options.method = 'POST';
      break;
    }
    case 'CHANGE_USER_TYPE': {
      const {userName, coUserType} = params;
      let queryString = '';
      if (coUserType) {
        queryString += `coUserType=${coUserType}`;
      }

      url = `${API_URL_CHAT}/${resource}/${userName}?${queryString}`;
      options.method = 'PUT';
      break;
    }
    case GET_LIST: {
      const filterPair = _.toPairs(params.filter);
      let
        filterField = '',
        filterValue = '',
        filterString = [],
        filteredResource = resource;
      if (resource === 'conversations') {
        filteredResource = `communication/${Utility.parseJWT().username}/threads/filter`;
      }
      if(filterPair.length > 0) {
        // Autocomplete workaround setting q to appropriate source field depending on resource
        switch(resource) {
          case 'jobtitles':
          case 'designations':
          case 'practicetypes':
          case 'facilities':
            const value = filterPair[0][1];
            filterPair[0][0] = 'name';
            filterPair[0][1] = value.toLowerCase();
            break;
          case 'healthcareprofessionals':
            if(filterPair[0][0] === 'userType' || filterPair[0][0] === 'userStatus') {
              let source = filterPair[0][1].split(':')[0];
              let value = filterPair[0][1].split(':')[1];
              if(value === '') {
                filterPair[0][0] = '';
                filterPair[0][1] = '';
              } else {
                filterPair[0][0] = source;
                filterPair[0][1] = value;
              }
            }
            break;
          case 'patients':
            if(filterPair[0][0] === 'userType' || filterPair[0][0] === 'userStatus') {
              const source = filterPair[0][1].split(':')[0];
              const value = filterPair[0][1].split(':')[1];
              if(value === '') {
                filterPair[0][0] = '';
                filterPair[0][1] = '';
              } else {
                filterPair[0][0] = source;
                filterPair[0][1] = value;
              }
            }
            break;
          default:
            break;
        }
        filterPair.forEach((f,k) => {
          filterField = f[0];
          filterValue = f[1];
          filterString += 'filter=' + filterField + ',' + filterValue + '&';
        });
      }
      const {page, perPage} = params.pagination;
      const {field, order} = params.sort;
      const query = {
        page: page - 1,
        size: perPage,
        sort: field + ',' + order.toLowerCase(),
        // filter: filterArray
      };

      url = `${API_URL_CHAT}/${filteredResource}?${queryParameters(query)}&${filterString}`;
      break;
    }
    case GET_ONE:
      url = `${API_URL_CHAT}/${resource}/${params.id}`;

      break;
    case GET_MANY: {
      const query = {
        filter: JSON.stringify({id: params.ids}),
      };

      url = `${API_URL_CHAT}/${resource}?${queryParameters(query)}`;
      break;
    }
    case GET_MANY_REFERENCE: {
      const {page, perPage} = params.pagination;
      const {field, order} = params.sort;
      const query = {
        sort: JSON.stringify([field, order]),
        range: JSON.stringify([(page - 1) * perPage, (page * perPage) - 1]),
        filter: JSON.stringify({...params.filter, [params.target]: params.id}),
      };

      url = `${API_URL_CHAT}/${resource}?${queryParameters(query)}`;
      break;
    }
    case UPDATE:
      url = `${API_URL_CHAT}/${resource}/${params.id}`;
      options.method = 'PUT';
      options.body = JSON.stringify(params.data);
      break;
    case CREATE:
      // mutate expiration date format to YYYY-MM-DD
      if (params.data.expirationDate) {
        params.data.expirationDate = moment(params.data.expirationDate).format('YYYY-MM-DD hh:mm:ss.SSSZ');
      }
      url = `${API_URL_CHAT}/${resource}`;
      console.log(url);
      options.method = 'POST';
      options.body = JSON.stringify(params.data);
      break;
    case DELETE:
      url = `${API_URL_CHAT}/${resource}/${params.id}`;
      options.method = 'DELETE';
      break;
    default:
      throw new Error(`Unsupported fetch action type ${type}`);
  }
  return {url, options};
};

/**
 * @param {Object} response HTTP response from fetch()
 * @param {String} type One of the constants appearing at the top if this file, e.g. 'UPDATE'
 * @param {String} resource Name of the resource to fetch, e.g. 'posts'
 * @param {Object} params The REST request params, depending on the type
 * @returns {Object} REST response
 */
const convertHTTPResponseToREST = (response, type, resource, params) => {
  const { json, body } = response;
  let data, totalElements;
  if(json) {
    totalElements = json.totalElements;

    if (!json.content) {
      data = json;
      // json.id = json.uid;
    } else {
      data = json.content;
      if (json.content[0] && (json.content[0].uid || json.content[0].name)) {
        data.forEach((item) => {
          if (_.isUndefined(item.id)) {
            item['id'] = item.uid || item.name;
          }
        });
      }
    }
  } else if (body) {
    return body;
  } else {
    return { data: type === 'CREATE' ? params.data : {} };
  }

  switch (type) {
    case 'GET_USER':
      return {
        data: data,
      };
    case 'GET':
      return {
        data: data,
        total: totalElements
      };
    case UPDATE:
      return {
        data: data,
      };
    case GET_LIST:
      return {
        data: data, //json.map(x => x),
        total: totalElements || data.length, //parseInt(headers.get('content-range').split('/').pop(), 10),
      };
    case CREATE:
      return {data: {...params.data, id: json.id}};
    default:
      return {data: json};
  }
};

/**
 * @param {string} type Request type, e.g GET_LIST
 * @param {string} resource Resource name, e.g. "posts"
 * @param {Object} payload Request parameters. Depends on the request type
 * @returns {Promise} the Promise for a REST response
 */
const RestClient = function() {
  this.client = (type, resource, params) => {
    const {fetchJson} = fetchUtils;
    const {url, options} = convertRESTRequestToHTTP(type, resource, params);
  
    if (!options.headers) {
      options.headers = new Headers({Accept: 'application/json'});
    }
    // const token = localStorage.getItem('IMYD_token');
    const token = Cookies.get('x-auth-token');
    options.headers.set('x-auth-token', token);
  
    return fetchJson(url, options)
      .then(response => {
  
        // console.log('ResponseJ:', response, url, options, resource);
  
        const resToRest = convertHTTPResponseToREST(response, type, resource, params);
        return resToRest;
      })
      .catch((error) => {
        if (error.status === 500 && error.body && error.body.message && this.store) {
          this.store.dispatch(showNotification(error.body.message, 'warning'));
        } else {
          const errorList = error.toString().split(';');
          let constraint = '';
            errorList.forEach(function(line) {
            if(line.indexOf('constraint') >= 0) {
              constraint = line.split('[')[1].split(']')[0];
            }
          });
          // Promise.reject(error);
          // console.log('Error List: ', type, error, errorList, constraint);
          // if(type !== 'GET_USER' && type !== 'GET_SETTINGS' && type !== 'ADD_TO_ORG_ROSTER' && type !== 'ADD_TO_ROSTER') {
          //   throw new Error(error);
          // }
        }
      });
  };
};

RestClient.prototype.setStore = function(store) {
  this.store = store;
}

export const restClientInstance = new RestClient();

export default restClientInstance.client;
