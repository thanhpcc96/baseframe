

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
  check('hashtags').exists(),
])

middlewares.push(validationHandlerMiddleware)

middlewares.push((req, res) => {
  const data = {
    userId: req.userId,
    audienceId: matchedData(req).audienceId,
    hashtags: matchedData(req).hashtags,
  }

  if (!_.isArray(data.hashtags)) {
    return res.jsonError(400)
  }

  // helper
  function mapHashtagAttributesObject(raw) {
    const allowed = ['igId', 'name', 'mediaCount']
    return Object.keys(raw)
      .filter(key => allowed.includes(key))
      .reduce((obj, key) => {
        obj[key] = raw[key]
        return obj
      }, {})
  }

  // helper
  function filterHashtagAttributesObject(hashtag) {
    if (!_.isObject(hashtag)) {
      return false
    }

    if (!_.isString(hashtag.name) || _.isEmpty(hashtag.name)) {
      return false
    }

    return true
  }

  // helper
  function convertAttributes(obj) {
    obj.igId = String(obj.igId)
    obj.name = obj.name ? String(obj.name) : null
    obj.mediaCount = obj.mediaCount && obj.mediaCount > 0 ? parseInt(obj.mediaCount, 10) : null
    return obj
  }

  data.hashtags = _
    .chain(data.hashtags)
    .map(mapHashtagAttributesObject)
    .filter(filterHashtagAttributesObject)
    .map(convertAttributes)
    .uniqWith((arrVal, othVal) => arrVal.name === othVal.name)
    .sortBy('name')
    .slice(0, 100)
    .compact()
    .value()

  res.manageServiceResponse(req.broker.call('data.audience.hashtags.update', data))
})
