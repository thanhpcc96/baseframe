

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
const middlewares = module.exports = []

middlewares.push([
  check('igAccountId').exists().isMongoId(),
  check('time').isInt(),
  sanitize('time').toInt(),
])

middlewares.push(validationHandlerMiddleware)

middlewares.push((req, res) => {
  const payload = {
    igAccountId: matchedData(req).igAccountId,
    time: matchedData(req).time,
    userId: req.userId,
  }

  res.manageServiceResponse(req.broker.call('data.igAccount.betaProgram.time.update', payload))
})
