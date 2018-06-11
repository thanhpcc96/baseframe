

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
  check('full').optional().isBoolean(),
  sanitize('full').toBoolean(),
])

middlewares.push((req, res) => {
  const data = matchedData(req)

  const payload = {
    less: data.less,
    full: data.full,
    userId: req.userId,
  }

  res.manageServiceResponse(req.broker.call('data.igAccount.find.online', payload))
})

module.exports = middlewares
