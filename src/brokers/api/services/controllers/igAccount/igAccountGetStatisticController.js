

const _ = require('lodash')

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
  check('startAt').exists().isInt({ min: 0 }),
  sanitize('startAt').toInt(),
  check('endAt').exists().isInt({ min: 0 }),
  sanitize('endAt').toInt(),
])

middlewares.push(validationHandlerMiddleware)

middlewares.push((req, res) => {
  const userId = req.userId
  const { igAccountId, startAt, endAt } = matchedData(req)

  req.broker.call('data.igAccount.find', { userId, less: true }).then((response) => {
    const accounts = response.data[response.type]
    const account = _.find(accounts, a => a.id === igAccountId)

    if (_.isEmpty(account)) {
      res.jsonData(404)
    } else {
      res.manageServiceResponse(req.broker.call('statistic.data.get', { igAccountId: account.igAccountId, startAt, endAt }))
    }
  }).catch(error => res.manageResponseObject(error))
})

module.exports = middlewares
