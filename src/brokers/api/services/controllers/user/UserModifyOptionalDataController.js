

const { check } = require('express-validator/check')
const { matchedData, sanitize } = require('express-validator/filter')

const { validationHandlerMiddleware } = require('./../../middlewares')

/**
 * [middlewares description]
 * @type {[type]}
 */
const middlewares = []

middlewares.push([
  check('country', 'Invalid first name.').exists().trim(),
  check('full').optional().isBoolean(),
  sanitize('full').toBoolean(),
])

middlewares.push(validationHandlerMiddleware)

middlewares.push((req, res, next) => {
  const payload = matchedData(req)
  payload.userId = req.userId
  res.manageServiceResponse(req.broker.call('data.user.optionalData.update', payload))
})

module.exports = middlewares

