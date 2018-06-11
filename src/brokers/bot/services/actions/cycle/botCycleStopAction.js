

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

  await action.saveCurrentState(igAccount, 'stop')
  await InstagramAccount.findOneAndUpdate({ igAccountId: igAccount.igAccountId }, { $set: { state: 'stopped' } }).exec()

  await action.drainIgAccountQueue(igAccount)

  await ctx.call('data.control.stopped', { igAccount: { igAccountId: igAccount.igAccountId } })
  await ctx.call('statistic.control.stopped', { igAccount: { igAccountId: igAccount.igAccountId } })

  await ctx.broker.call('historical.add.entry', {
    igAccountId: igAccount.igAccountId,
    action: 'stop',
    time: Date.now(),
  })

  return new OkResponse()
}

module.exports = action
