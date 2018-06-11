const util = require('util')
const _ = require('lodash')
const Resource = require('./resource')
const camelKeys = require('camelcase-keys')


function Hashtag(session, params) {
  Resource.apply(this, arguments)
}

util.inherits(Hashtag, Resource)
module.exports = Hashtag

const Request = require('./request')
const Helpers = require('./../helpers')

Hashtag.prototype.parseParams = function parseParams(json) {
  const hash = camelKeys(json, { deep: true })
  hash.mediaCount = parseInt(hash.mediaCount, 10)
  if (_.isObject(hash.id)) { hash.igId = hash.id.toString() }
  return hash
}

Hashtag.search = function search(session, query) {
  return session.getAccountId()
    .then((id) => {
      const rankToken = Helpers.buildRankToken(id)
      return new Request(session)
        .setMethod('GET')
        .setResource('hashtagsSearch', {
          query,
          rankToken,
        })
        .send()
    })
    .then(data => _.map(data.results, hashtag => new Hashtag(session, hashtag)))
}
/*
Hashtag.related = function (session, tag) {
  return new Request(session)
    .setMethod('GET')
    .setResource('hashtagsRelated', {
      tag,
      visited: `[{"id":"${tag}","type":"hashtag"}]`,
      related_types: '["hashtag"]',
    })
    .send()
    .then(data => _.map(data.related, hashtag => new Hashtag(session, hashtag)))
}

Hashtag.info = function (session, tag) {
  return new Request(session)
    .setMethod('GET')
    .setResource('hashtagsInfo', {
      tag,
    })
    .send()
    .then(hashtag => new Hashtag(session, hashtag))
}
*/
