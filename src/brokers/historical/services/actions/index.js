

const addEntryAction = require('./historicalAddEntryAction')
const getAction = require('./historicalGetAction')

module.exports = {
  'add.entry': addEntryAction,
  get: getAction,
}
