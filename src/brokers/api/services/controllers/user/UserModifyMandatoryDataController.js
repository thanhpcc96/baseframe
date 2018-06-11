

const { check } = require('express-validator/check')
const { matchedData, sanitize } = require('express-validator/filter')

const { validationHandlerMiddleware } = require('./../../middlewares')

/**
 * [middlewares description]
 * @type {[type]}
 */
const middlewares = []

middlewares.push([
  check('email', 'Invalid email.').exists().isEmail().trim()
    .normalizeEmail(),
  check('firstName', 'Invalid first name.').exists().trim(),
  check('lastName', 'Invalid last name.').exists().trim(),
  check('full').optional().isBoolean(),
  sanitize('full').toBoolean(),
])

middlewares.push(validationHandlerMiddleware)

middlewares.push((req, res, next) => {
  const payload = matchedData(req)
  payload.userId = req.userId
  res.manageServiceResponse(req.broker.call('data.user.mandatoryData.update', payload))
})

module.exports = middlewares
