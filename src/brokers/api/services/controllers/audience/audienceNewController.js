

const {
  matchedData,
} = require('express-validator/filter')

/**
 * [middlewares description]
 * @type {[type]}
 */
const middlewares = module.exports = []

middlewares.push((req, res, next) => {
  const payload = matchedData(req)
  payload.userId = req.userId

  res.manageServiceResponse(req.broker.call('data.audience.create', payload))
})
