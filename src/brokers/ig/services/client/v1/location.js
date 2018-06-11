const util = require('util')
const _ = require('lodash')
const Resource = require('./resource')
const camelKeys = require('camelcase-keys')

function Location(session, params) {
  Resource.apply(this, arguments)
}

util.inherits(Location, Resource)
module.exports = Location

const Request = require('./request')
const Helpers = require('./../helpers')
const Media = require('./media')
const Exceptions = require('./exceptions')

/*
Location.getRankedMedia = function (session, locationId) {
  return new Request(session)
    .setMethod('GET')
    .setResource('locationFeed', {
      id: locationId,
      maxId: null,
      rankToken: Helpers.generateUUID(),
    })
    .send()
    .then(data => _.map(data.ranked_items, medium => new Media(session, medium)))
  // will throw an error with 500 which turn to parse error
    .catch(Exceptions.ParseError, () => {
      throw new Exceptions.PlaceNotFound()
    })
}
*/

Location.prototype.parseParams = function parseParams(json) {
  const hash = camelKeys(json)
  hash.address = json.location.address
  hash.city = json.location.city
  hash.state = json.location.state
  hash.igId = json.location.id || json.location.pk
  hash.lat = parseFloat(json.location.lat) || 0
  hash.lng = parseFloat(json.location.lng) || 0
  return hash
}

Location.search = function search(session, query) {
  return session.getAccountId()
    .then((id) => {
      const rankToken = Helpers.buildRankToken(id)
      return new Request(session)
        .setMethod('GET')
        .setResource('locationsSearch', {
          query,
          rankToken,
        })
        .send()
    })
    .then(data => _.map(data.items, location => new Location(session, location)))
}
