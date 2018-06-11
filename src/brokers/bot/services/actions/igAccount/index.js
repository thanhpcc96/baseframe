
const botIgAccountAddAction = require('./botIgAccountAddAction')
const botIgAccountFindOneIgAccountIdAction = require('./botIgAccountFindOneIgAccountIdAction')
const botIgAccountUpdateSessionCookiesAction = require('./botIgAccountUpdateSessionCookiesAction')
const botIgAccountFetchAction = require('./botIgAccountFetchAction')
const botIgAccountStartAction = require('./botIgAccountStartAction')
const botIgAccountStopAction = require('./botIgAccountStopAction')
const botIgAccountRestartAction = require('./botIgAccountRestartAction')

module.exports = {
  add: botIgAccountAddAction,
  'findOne.igAccountId': botIgAccountFindOneIgAccountIdAction,
  updateSessionCookies: botIgAccountUpdateSessionCookiesAction,
  fetch: botIgAccountFetchAction,
  start: botIgAccountStartAction,
  restart: botIgAccountRestartAction,
  stop: botIgAccountStopAction,
}
