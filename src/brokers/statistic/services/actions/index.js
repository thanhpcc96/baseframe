

const _ = require('lodash')

const igAccountActions = _.mapKeys(require('./igAccount'), (value, key) => `igAccount.${key}`)
const dataActions = _.mapKeys(require('./data'), (value, key) => `data.${key}`)
const controlActions = _.mapKeys(require('./control'), (value, key) => `control.${key}`)

module.exports = _.assign(
  {},
  igAccountActions,
  controlActions,
  dataActions,
)

