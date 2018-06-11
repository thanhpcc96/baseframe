

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
  check('name').exists(),
])

middlewares.push(validationHandlerMiddleware)

middlewares.push((req, res) => {
  const payload = {
    userId: req.userId,
    audienceId: matchedData(req).audienceId,
    name: matchedData(req).name,
  }

  res.manageServiceResponse(req.broker.call('data.audience.name.update', payload))
})
