

const botAdminIgAccountFindAllAction = require('./botAdminIgAccountFindAllAction.js')
const botAdminQueueWorkerFindAllAction = require('./botAdminQueueWorkerFindAllAction.js')

module.exports = {
  'igAccount.findAll': botAdminIgAccountFindAllAction,
  'queue.worker.findAll': botAdminQueueWorkerFindAllAction,
}

