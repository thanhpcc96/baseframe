

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
])

middlewares.push(validationHandlerMiddleware)

middlewares.push((req, res) => {
  const userId = req.userId
  const igAccountId = matchedData(req).igAccountId
  const startAt = matchedData(req).startAt

  req.broker.call('data.igAccount.find', { userId, less: true }).then((response) => {
    const accounts = response.data[response.type]
    const account = _.find(accounts, a => a.id === igAccountId)

    if (_.isEmpty(account)) {
      res.jsonData(404)
    } else {
      res.manageServiceResponse(req.broker.call('historical.get', { igAccountId: account.igAccountId, startAt }))
    }
  }).catch(error => res.manageResponseObject(error))
})


module.exports = middlewares

