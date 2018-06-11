

const util = require('util')
const Promise = require('bluebird')
const CONSTANTS = require('./constants')
const _ = require('lodash')


function CookieStorage(cookieStorage) {
  this.storage = cookieStorage
}

Object.defineProperty(CookieStorage.prototype, 'store', {
  get() { return this.storage },
  set(val) {},
})


const Exceptions = require('./exceptions')

module.exports = CookieStorage

CookieStorage.prototype.getCookieValue = function getCookieValue(name) {
  const self = this
  return new Promise(((resolve, reject) => {
    self.storage.findCookie(CONSTANTS.HOSTNAME, '/', name, (err, cookie) => {
      if (err) return reject(err)
      if (!_.isObject(cookie)) return reject(new Exceptions.CookieNotValidError(name))
      resolve(cookie)
    })
  }))
}

CookieStorage.prototype.putCookie = function putCookie(cookie) {
  const args = _.toArray(arguments)
  const self = this
  return new Promise(((resolve, reject) => {
    self.storage.putCookie(cookie, resolve)
  }))
}

CookieStorage.prototype.getCookies = function getCookies() {
  const self = this
  return new Promise(((resolve, reject) => {
    self.storage.findCookies(CONSTANTS.HOSTNAME, '/', (err, cookies) => {
      if (err) return reject(err)
      resolve(cookies || [])
    })
  }))
}

CookieStorage.prototype.getAccountId = function getAccountId() {
  const self = this
  return this.getCookieValue('ds_user_id')
    .then((cookie) => {
      // we check is a int but we work with strings!
      const idInt = parseInt(cookie.value, 10)
      if (!_.isNumber(idInt) || _.isNaN(idInt)) {
        throw new Exceptions.CookieNotValidError('ds_user_id')
      }
      return cookie.value
    })
}

CookieStorage.prototype.getSessionId = function getSessionId() {
  const currentTime = new Date().getTime()
  return this.getCookieValue('sessionid')
    .then((cookie) => {
      const acceptable = cookie.expires instanceof Date && cookie.expires.getTime() > currentTime
      if (acceptable) return cookie.value
      throw new Exceptions.CookieNotValidError('sessionid')
    })
}


CookieStorage.prototype.removeCheckpointStep = function removeCheckpointStep() {
  const self = this
  return new Promise(((resolve, reject) => {
    self.storage.removeCookie(CONSTANTS.HOSTNAME, '/', 'checkpoint_step', (err) => {
      if (err) return reject(err)
      resolve()
    })
  }))
}


CookieStorage.prototype.destroy = function () {
  throw new Error('Mehtod destroy is not implemented')
}
