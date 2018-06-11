

const _ = require('lodash')

const igAccountActions = _.mapKeys(require('./igAccount'), (value, key) => `igAccount.${key}`)
const controlActions = _.mapKeys(require('./control'), (value, key) => `control.${key}`)
const managementActions = _.mapKeys(require('./management'), (value, key) => `management.${key}`)
const cycleActions = _.mapKeys(require('./cycle'), (value, key) => `cycle.${key}`)
const decisionsActions = _.mapKeys(require('./decisions'), (value, key) => `decisions.${key}`)
const adminActions = _.mapKeys(require('./admin'), (value, key) => `admin.${key}`)

module.exports = _.assign(
  {},
  igAccountActions,
  controlActions,
  managementActions,
  cycleActions,
  decisionsActions,
  adminActions,
)

