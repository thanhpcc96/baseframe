

const _ = require('lodash')

const userActions = _.mapKeys(require('./user'), (value, key) => `user.${key}`)
const igAccountActions = _.mapKeys(require('./igAccount'), (value, key) => `igAccount.${key}`)
const audienceActions = _.mapKeys(require('./audience'), (value, key) => `audience.${key}`)
const controlActions = _.mapKeys(require('./control'), (value, key) => `control.${key}`)
const adminActions = _.mapKeys(require('./admin'), (value, key) => `admin.${key}`)

module.exports = _.assign(
  {},
  userActions,
  igAccountActions,
  audienceActions,
  controlActions,
  adminActions,
)

