
const {
  check,
} = require('express-validator/check')

const {
  matchedData,
  sanitize,
} = require('express-validator/filter')

/**
 * [middlewares description]
 * @type {[type]}
 */

const middlewares = []

middlewares.push([
  check('full').optional().isBoolean(),
  sanitize('full').toBoolean(),
])

middlewares.push((req, res, next) => {
  const payload = {
    userId: req.userId,
    full: matchedData(req).full,
  }

  res.manageServiceResponse(req.broker.call('data.user.find.id', payload))
})

module.exports = middlewares
