
const IMYD_ENV = process.env.REACT_APP_IMYD_ENV;
const prod = IMYD_ENV === 'production';
const qa = IMYD_ENV === 'qa';
const dev = !prod && !qa;
const host = prod ? 's.imyourdoc.com' : 's-qa.imyourdoc.com';

console.log(`Configuration: ${IMYD_ENV}`);

export default {
  mode: process.env.NODE_ENV,
  debug: process.env.REACT_APP_IMYD_DEBUG,
  domain: dev ? 'localhost' : 'imyourdoc.com',
  socketUrl: `https://${host}/imyd-webchat-web`,
  apiAdminUrl: `https://${host}/imyd-admin-api`,
  apiUrl: `https://${host}/imyd-webchat-api`,
  authUrl: `https://${host}/imyd-auth-stateless-web`,
  imageUrl: prod ? 'https://api-qa.imyourdoc.com' : 'https://api-qa.imyourdoc.com',
  sessionTimeout: prod ? 25 : 12, // a little bit less than what it is set on the server for session
  tokenTimeout: prod ? 230 : 100, // a little bit less than what it is set on the server for the token
  mainSiteUrl: prod ? 'https://imyourdoc.com' : 'https://www-qa.imyourdoc.com',
  chatURL: prod ? 'https://chat.imyourdoc.com' : 'https://chat-qa.imyourdoc.com'
}