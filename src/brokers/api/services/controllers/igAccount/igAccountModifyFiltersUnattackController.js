

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

  check('whoDontFollowMe').isBoolean(),
  sanitize('whoDontFollowMe').toBoolean(),

  check('full').optional(),
  sanitize('full').toBoolean(),
])

middlewares.push(validationHandlerMiddleware)

middlewares.push((req, res) => {
  const payload = {
    igAccountId: matchedData(req).igAccountId,
    whoDontFollowMe: matchedData(req).whoDontFollowMe,
    full: matchedData(req).full,
    userId: req.userId,
  }

  res.manageServiceResponse(req.broker.call('data.igAccount.filters.unattack.update', payload))
})
