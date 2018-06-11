

const {
  check,
} = require('express-validator/check')

const {
  matchedData,
  sanitize,
} = require('express-validator/filter')

const {
  validationHandlerMiddleware,
} = require('./../../middlewares')

/**
 * [middlewares description]
 * @type {[type]}
 */
const middlewares = []

middlewares.push([
  check('less').optional().isBoolean(),
  sanitize('less').toBoolean(),
])

middlewares.push(validationHandlerMiddleware)

middlewares.push((req, res) => {
  const payload = {
    less: matchedData(req).less,
    userId: req.userId,
  }

  res.manageServiceResponse(req.broker.call('data.audience.find.user', payload))
})

module.exports = middlewares
