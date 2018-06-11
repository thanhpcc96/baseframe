

const { check } = require('express-validator/check')
const { matchedData, sanitize } = require('express-validator/filter')

const { validationHandlerMiddleware } = require('./../../middlewares')

/**
 * [middlewares description]
 * @type {[type]}
 */
const middlewares = []

middlewares.push([
  check('igAccountId').exists().isMongoId(),
  check('code').exists(),
  check('full').optional(),
  sanitize('full').toBoolean(),
])

middlewares.push(validationHandlerMiddleware)

middlewares.push((req, res) => {
  const payload = {
    igAccountId: matchedData(req).igAccountId,
    code: matchedData(req).code,
    full: matchedData(req).full,
    userId: req.userId,
  }

  res.manageServiceResponse(req.broker.call('data.igAccount.challenge.update.code', payload))
})

module.exports = middlewares
