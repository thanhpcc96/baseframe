

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

  check('age').isInt(),
  sanitize('age').toInt(),

  check('full').optional(),
  sanitize('full').toBoolean(),
])

middlewares.push(validationHandlerMiddleware)

middlewares.push((req, res) => {
  const payload = {
    igAccountId: matchedData(req).igAccountId,
    age: matchedData(req).age,
    full: matchedData(req).full,
    userId: req.userId,
  }

  res.manageServiceResponse(req.broker.call('data.igAccount.filters.media.update', payload))
})
