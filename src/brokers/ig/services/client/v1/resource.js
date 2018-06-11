

// const EventEmitter = require('events').EventEmitter

const util = require('util')
const _ = require('lodash')
const camelKeys = require('camelcase-keys')

function InstagramResource(session, params) {
  // EventEmitter.call(this)

  const Session = require('./session')
  if (!(session instanceof Session)) { throw new Error('Argument `session` is not instace of Session') }
  this.session = session
  this.params = {}
  this.setParams(_.isObject(params) ? params : {})
}

// util.inherits(InstagramResource, EventEmitter)

module.exports = InstagramResource

const Request = require('./request')

/*
Object.defineProperty(InstagramResource.prototype, 'params', {
  get() { return this.getParams() },
})
*/
/*
Object.defineProperty(InstagramResource.prototype, 'session', {
  get() { return this.session },
})
*/

InstagramResource.prototype.parseParams = function parseParams(params) {
  // Override this to parse instagram shit
  return camelKeys(params)
}

InstagramResource.prototype.setParams = function setParams(params) {
  if (!_.isObject(params)) { throw new Error('Method `setParams` must have valid argument') }
  params = this.parseParams(params)
  if (!_.isObject(params)) { throw new Error('Method `parseParams` must return object') }
  this.params = params
  if (params.id) this.id = params.id
  return this
}

InstagramResource.prototype.getParams = function getParams() {
  return this.params
}

InstagramResource.prototype.getSession = function getSession() {
  return this.session
}

InstagramResource.prototype.request = function request() {
  return new Request(this.session)
}

