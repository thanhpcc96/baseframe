

const _ = require('lodash')

const { OkResponse } = rootRequire('./src/models')
const utils = rootRequire('./src/utils')
const botCycleBaseAction = require('./botCycleBaseAction')

/**
 * main
 */

const action = _.defaultsDeep({}, botCycleBaseAction)

action.handler = async (ctx) => {
  const { igAccount } = ctx.params

  await action.saveCurrentState(igAccount, 'controlNoMoreUnattackSources')

  // if we ONLY have unattack active and we have dont have any account to unfollow. stop activity
  const thereIsNotAccountReady = _.isEmpty(igAccount.cycle.ready.unattack.accounts)

  if (!action.attackActive(igAccount) && action.unattackActive(igAccount) && thereIsNotAccountReady) {
    await ctx.broker.call('data.igAccount.notification.create', { igAccountId: igAccount.igAccountId, type: 'noMoreActionsToDo' })
    await action.forwardState(igAccount, 'stop', false)
  } else {
    await action.forwardState(igAccount, 'unattack', false)
  }

  return new OkResponse()
}

module.exports = action

