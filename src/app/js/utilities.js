import Cookies from 'js-cookie';

const Utility = {

  parseJWT: () => {
    const token = Cookies.get('x-auth-token');
    if (token) {
      const base64 = token.split('.')[1].replace('-', '+').replace('_', '/');
      return JSON.parse(window.atob(base64));
    }
    return {};
  },

  IMYD_DATETIME_FORMAT: 'MM/DD/YYYY hh:mm:ss A',

  Array: {
    dedup: (array) => {
      return Array.from(new Set(array));
    }
  }
};

export default Utility;