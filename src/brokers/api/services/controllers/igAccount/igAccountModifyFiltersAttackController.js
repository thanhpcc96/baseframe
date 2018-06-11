

const { check } = require('express-validator/check')
const { matchedData, sanitize } = require('express-validator/filter')

const { validationHandlerMiddleware } = require('./../../middlewares')

/**
 * [middlewares description]
 * @type {[type]}
 */
const middlewares = module.exports = []

middlewares.push([
  check('igAccountId').exists().isMongoId(),

  check('privateAccounts').isBoolean(),
  sanitize('privateAccounts').toBoolean(),

  check('businessAccounts').isBoolean(),
  sanitize('businessAccounts').toBoolean(),

  check('notFollowers').isBoolean(),
  sanitize('notFollowers').toBoolean(),

  check('moreThanOnce').isBoolean(),
  sanitize('moreThanOnce').toBoolean(),

  check('timeBetweenAttacksSameAccount').isInt(),
  sanitize('timeBetweenAttacksSameAccount').toInt(),

  check('full').optional(),
  sanitize('full').toBoolean(),
])

middlewares.push(validationHandlerMiddleware)

middlewares.push((req, res) => {
  const payload = {
    igAccountId: matchedData(req).igAccountId,
    privateAccounts: matchedData(req).privateAccounts,
    businessAccounts: matchedData(req).businessAccounts,
    notFollowers: matchedData(req).notFollowers,
    moreThanOnce: matchedData(req).moreThanOnce,
    timeBetweenAttacksSameAccount: matchedData(req).timeBetweenAttacksSameAccount,
    full: matchedData(req).full,
    userId: req.userId,
  }

  res.manageServiceResponse(req.broker.call('data.igAccount.filters.attack.update', payload))
})
