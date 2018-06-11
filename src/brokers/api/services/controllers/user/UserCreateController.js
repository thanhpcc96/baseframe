

const { check, validationResult } = require('express-validator/check')
const { matchedData, sanitize } = require('express-validator/filter')

const { validationHandlerMiddleware, captchaMiddleware, OauthMiddleware } = require('./../../middlewares')

/**
 * [middlewares description]
 * @type {[type]}
 */
const middlewares = module.exports = []

middlewares.push([
  // check('captcha').exists(),
  check('email', 'Invalid email.').exists().isEmail().trim()
    .normalizeEmail(),
  check('password', 'Invalid password.').exists().trim(),
  check('firstName', 'Invalid first name.').exists().trim(),
  check('lastName', 'Invalid last name.').exists().trim(),
])

middlewares.push(validationHandlerMiddleware)

middlewares.push((req, res, next) => {
  const payload = matchedData(req)
  res.manageServiceResponse(req.broker.call('data.user.create', payload))
})
