

const _ = require('lodash')
const mongoose = require('mongoose')

const { OkResponse } = rootRequire('./src/models')
const botCycleBaseAction = require('./botCycleBaseAction')

const InstagramAccount = mongoose.model('InstagramAccount')

/**
 * main
 */

const action = _.defaultsDeep({}, botCycleBaseAction)

action.handler = async (ctx) => {
  const { igAccount } = ctx.params

  await action.saveCurrentState(igAccount, 'init')
  await InstagramAccount.findOneAndUpdate({ igAccountId: igAccount.igAccountId }, { $set: { state: 'started' } }).exec()

  // let the other services know it
  await ctx.call('data.control.started', { igAccount: { igAccountId: igAccount.igAccountId } })
  await ctx.call('statistic.control.started', { igAccount: { igAccountId: igAccount.igAccountId } })

  // add historic entry
  await ctx.broker.call('historical.add.entry', {
    igAccountId: igAccount.igAccountId,
    action: 'init',
    time: Date.now(),
  })

  await action.forwardState(igAccount, 'configuration')
  return new OkResponse()
}

module.exports = action
