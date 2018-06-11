

const tough = require('tough-cookie')
const CONSTANTS = require('./constants')

const CookieJar = tough.CookieJar

// We need to trick the request.js library on order
// to get cookies from i.instagram.com instead of www.instagram.com


function RequestJar(store) {
  const self = this
  self._jar = new CookieJar(store, { looseMode: true })
}

module.exports = RequestJar

RequestJar.prototype.rewriteUri = function rewriteUri(uri) {
  uri = uri.replace(CONSTANTS.WEB_HOSTNAME, CONSTANTS.HOSTNAME)
  uri = uri.replace(`://${CONSTANTS.TLD}`, `://${CONSTANTS.HOSTNAME}`)
  return uri
}

RequestJar.prototype.setCookie = function setCookie(cookieOrStr, uri, options) {
  const self = this
  uri = this.rewriteUri(uri)
  return self._jar.setCookieSync(cookieOrStr, uri, options || {})
}

RequestJar.prototype.getCookieString = function getCookieString(uri) {
  const self = this
  uri = this.rewriteUri(uri)
  return self._jar.getCookieStringSync(uri)
}

RequestJar.prototype.getCookies = function getCookies(uri) {
  const self = this
  uri = this.rewriteUri(uri)
  return self._jar.getCookiesSync(uri)
}
