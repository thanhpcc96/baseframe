

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
const middlewares = module.exports = []

middlewares.push([
  check('audienceId').exists().isMongoId(),
])

middlewares.push(validationHandlerMiddleware)

middlewares.push((req, res) => {
  const payload = {
    userId: req.userId,
    audienceId: matchedData(req).audienceId,
  }

  res.manageServiceResponse(req.broker.call('data.audience.remove', payload))
})
