

// generic actions
const listFollowsMadeAddOrUpdateAction = require('./listFollowsMadeAddOrUpdateAction')
const listFollowsMadeFindOneAction = require('./listFollowsMadeFindOneAction')
const listAccountsFollowersPurgeAction = require('./listAccountsFollowersPurgeAction')
const listAccountsFollowersAddAction = require('./listAccountsFollowersAddAction')
const listAccountsFollowersFindOneAction = require('./listAccountsFollowersFindOneAction')

// exports
module.exports = {
  'accounts.followsMade.addOrUpdate': listFollowsMadeAddOrUpdateAction,
  'accounts.followsMade.findOne': listFollowsMadeFindOneAction,
  'accounts.followers.purge': listAccountsFollowersPurgeAction,
  'accounts.followers.add': listAccountsFollowersAddAction,
  'accounts.followers.findOne': listAccountsFollowersFindOneAction,
}
