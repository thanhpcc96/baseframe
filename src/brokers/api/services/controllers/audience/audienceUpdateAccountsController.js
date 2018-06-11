

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
  check('accounts').exists(),
])

middlewares.push(validationHandlerMiddleware)

middlewares.push((req, res) => {
  const data = {
    userId: req.userId,
    audienceId: matchedData(req).audienceId,
    accounts: matchedData(req).accounts,
  }

  if (!_.isArray(data.accounts)) {
    return res.jsonError(400)
  }

  // helper
  function mapAccountsAttributesObject(raw) {
    const allowed = ['igId', 'followerCount', 'fullName', 'isVerified', 'profilePicUrl', 'username']
    return Object.keys(raw)
      .filter(key => allowed.includes(key))
      .reduce((obj, key) => {
        obj[key] = raw[key]
        return obj
      }, {})
  }

  // helper
  function filterAccountsAttributesObject(account) {
    if (!_.isObject(account)) {
      return false
    }

    if (!_.isString(account.username) || _.isEmpty(account.username)) {
      return false
    }

    return true
  }

  // helper
  function convertAttributes(obj) {
    obj.igId = String(obj.igId)
    obj.followerCount = obj.followerCount && obj.followerCount > 0 ? parseInt(obj.followerCount, 10) : null
    obj.fullName = obj.fullName ? String(obj.fullName) : null
    obj.isVerified = !!obj.isVerified
    obj.profilePicUrl = obj.profilePicUrl ? String(obj.profilePicUrl) : null
    obj.username = String(obj.username)
    return obj
  }

  data.accounts = _
    .chain(data.accounts)
    .map(mapAccountsAttributesObject)
    .filter(filterAccountsAttributesObject)
    .map(convertAttributes)
    .uniqWith((arrVal, othVal) => arrVal.username === othVal.username)
    .sortBy('username')
    .slice(0, 100)
    .compact()
    .value()

  res.manageServiceResponse(req.broker.call('data.audience.accounts.update', data))
})
