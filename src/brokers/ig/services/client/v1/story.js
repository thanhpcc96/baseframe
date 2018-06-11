const Resource = require('./resource')
const util = require('util')
const _ = require('lodash')
const crypto = require('crypto')
const pruned = require('./json-pruned')
const fs = require('fs')
const request = require('request-promise')
const Promise = require('bluebird')


function Story(session, params) {
  Resource.apply(this, arguments)
}

util.inherits(Story, Resource)

module.exports = Story

const Request = require('./request')
const camelKeys = require('camelcase-keys')

Story.prototype.parseParams = json => camelKeys(json)

Story.getByUserId = (session, userId) => new Request(session)
  .setMethod('GET')
  .setResource('feedUserStory', { userId })
  .send()
  .then(json => new Story(session, json))

