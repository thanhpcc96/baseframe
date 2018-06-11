

const { check } = require('express-validator/check')
const { matchedData, sanitize } = require('express-validator/filter')

const { validationHandlerMiddleware } = require('./../../middlewares')

/**
 * [middlewares description]
 * @type {[type]}
 */
const middlewares = module.exports = []

middlewares.push([
  check('igAccountId').exists().isMongoId(),
  check('automatic').exists().isBoolean(),
  sanitize('automatic').toBoolean(),
  check('follow').exists().isInt(),
  sanitize('follow').toInt(),
  check('unfollow').exists().isInt(),
  sanitize('unfollow').toInt(),
  check('full').optional(),
  sanitize('full').toBoolean(),
])

middlewares.push(validationHandlerMiddleware)

middlewares.push((req, res) => {
  const payload = {
    igAccountId: matchedData(req).igAccountId,
    follow: matchedData(req).follow,
    automatic: matchedData(req).automatic,
    unfollow: matchedData(req).unfollow,
    full: matchedData(req).full,
    userId: req.userId,
  }

  res.manageServiceResponse(req.broker.call('data.igAccount.cycleSize.update', payload))
})
