const Resource = require('./resource')
const util = require('util')
const _ = require('lodash')
const crypto = require('crypto')
const pruned = require('./json-pruned')
const fs = require('fs')
const request = require('request-promise')
const Promise = require('bluebird')

function Discover(session, params) {
  Resource.apply(this, arguments)
}

util.inherits(Discover, Resource)

module.exports = Discover

const Request = require('./request')
const camelKeys = require('camelcase-keys')

Discover.prototype.parseParams = json => camelKeys(json)

Discover.postProfileSuBadge = session => new Request(session)
  .setMethod('POST')
  .setResource('discoverProfileSuBadge')
  .setData({})
  .send()
  .then(json => new Discover(session, json))


/*
module.exports = function (session, inSingup) {
  return new Request(session)
    .setMethod('POST')
    .setResource('discoverAyml')
    .generateUUID()
    .setData({
      phone_id: Helpers.generateUUID(),
      in_singup: inSingup ? 'true' : 'false',
      module: 'ayml_recommended_users',
    })
    .send()
    .then((json) => {
      const groups = _.first(json.groups || [])
      const items = groups.items || []
      return _.map(items, item => ({
        account: new Account(session, item.user),
        mediaIds: item.media_ids,
      }))
    })
}
*/
