

const _ = require('lodash')

const searchActions = _.mapKeys(require('./search'), (value, key) => `search.${key}`)
const accountActions = _.mapKeys(require('./account'), (value, key) => `account.${key}`)
const challengeActions = _.mapKeys(require('./challenge'), (value, key) => `challenge.${key}`)
const feedsActions = _.mapKeys(require('./feeds'), (value, key) => `feeds.${key}`)
const mediaActions = _.mapKeys(require('./media'), (value, key) => `media.${key}`)
const relationshipActions = _.mapKeys(require('./relationship'), (value, key) => `relationship.${key}`)
const utilsActions = _.mapKeys(require('./utils'), (value, key) => `utils.${key}`)

module.exports = _.assign(
  {},
  searchActions,
  accountActions,
  feedsActions,
  mediaActions,
  relationshipActions,
  challengeActions,
  utilsActions,
)
