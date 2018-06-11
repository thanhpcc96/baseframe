

const dataAdminIgAccountFindAllAction = require('./dataAdminIgAccountFindAllAction.js')
const dataAdminUserFindAllAction = require('./dataAdminUserFindAllAction.js')

module.exports = {
  'igAccount.findAll': dataAdminIgAccountFindAllAction,
  'user.findAll': dataAdminUserFindAllAction,
}

