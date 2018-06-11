

const _ = require('lodash')

const { check } = require('express-validator/check')

const { matchedData } = require('express-validator/filter')

const { validationHandlerMiddleware } = require('./../../middlewares')

/**
 * [middlewares description]
 * @type {[type]}
 */
const middlewares = module.exports = []

middlewares.push([
  check('audienceId').exists().isMongoId(),
  check('locations').exists(),
])

middlewares.push(validationHandlerMiddleware)

middlewares.push((req, res) => {
  const data = {
    userId: req.userId,
    audienceId: matchedData(req).audienceId,
    locations: matchedData(req).locations,
  }

  if (!_.isArray(data.locations)) {
    return res.jsonError(400)
  }

  // helper
  function mapLocationAttributesObject(raw) {
    const allowed = ['igId', 'title', 'subtitle', 'lat', 'lng']
    return Object.keys(raw)
      .filter(key => allowed.includes(key))
      .reduce((obj, key) => {
        obj[key] = raw[key]
        return obj
      }, {})
  }

  // helper
  function filterLocationAttributesObject(location) {
    if (!_.isObject(location)) {
      return false
    }

    if (!_.isString(location.title) || _.isEmpty(location.title)) {
      return false
    }

    if (!_.inRange(location.lat, -90, 90) || !_.inRange(location.lng, -180, 180)) {
      return false
    }

    return true
  }

  // helper
  function convertAttributes(obj) {
    obj.igId = String(obj.igId)
    obj.title = obj.title ? String(obj.title) : null
    obj.subtitle = obj.subtitle ? String(obj.subtitle) : null
    obj.lat = parseFloat(obj.lat)
    obj.lng = parseFloat(obj.lng)
    return obj
  }

  data.locations = _
    .chain(data.locations)
    .map(mapLocationAttributesObject)
    .filter(filterLocationAttributesObject)
    .map(convertAttributes)
    .uniqWith((arrVal, othVal) => arrVal.lat === othVal.lat && arrVal.lng === othVal.lng)
    .sortBy('title')
    .slice(0, 100)
    .compact()
    .value()

  res.manageServiceResponse(req.broker.call('data.audience.locations.update', data))
})
