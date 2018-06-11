

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
  check('igAccountId').exists().isMongoId(),
  check('notificationId').exists().isMongoId(),
])

middlewares.push(validationHandlerMiddleware)

middlewares.push((req, res) => {
  const payload = {
    igAccountId: matchedData(req).igAccountId,
    notificationId: matchedData(req).notificationId,
    userId: req.userId,
  }

  res.manageServiceResponse(req.broker.call('data.igAccount.notification.remove', payload))
})

module.exports = middlewares
