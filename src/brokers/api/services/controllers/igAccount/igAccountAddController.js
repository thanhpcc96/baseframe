

const {
  check,
} = require('express-validator/check')

const {
  matchedData,
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
  check('username').exists().isLength({
    min: 1,
  }).trim(),
  check('password').exists().isLength({
    min: 1,
  }).trim(),
])

middlewares.push(validationHandlerMiddleware)

middlewares.push((req, res) => {
  const payload = matchedData(req)
  payload.userId = req.userId
  payload.ip = req.ip

  res.manageServiceResponse(req.broker.call('data.igAccount.add', payload))
})

module.exports = middlewares
