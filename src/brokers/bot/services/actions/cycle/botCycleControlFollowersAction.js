

const _ = require('lodash')
const mongoose = require('mongoose')
const { DateTime, Duration } = require('luxon')

const utils = rootRequire('./src/utils')
const { OkResponse } = rootRequire('./src/models')
const { MoleculerConflictDataError, MoleculerInternalError } = rootRequire('./src/errors')
const botCycleBaseAction = require('./botCycleBaseAction')

/**
 * main
 */

const InstagramAccount = mongoose.model('InstagramAccount')

const action = _.defaultsDeep({}, botCycleBaseAction)

action.handler = async (ctx) => {
  const { igAccount } = ctx.params

  await action.saveCurrentState(igAccount, 'controlFollowers')

  const followersUpdatedAt = igAccount.cycle.followersUpdatedAt

  const itsNeedToUpdateFollowers = action.attackActive(igAccount) && (
    followersUpdatedAt === null ||
    followersUpdatedAt === undefined ||
    followersUpdatedAt.valueOf() < DateTime.utc().minus({ days: 4 }).valueOf())

  if (itsNeedToUpdateFollowers) {
    // 1. remove all followers
    await ctx.broker.call('list.accounts.followers.purge', { to: igAccount.igAccountId })

    // 2. get page by page all followers and update service
    let cursor = null
    let iteration = 0
    let moreAvailable = false
    let accounts = []

    do {
      iteration += 1

      if (iteration > 1) {
        await utils.timeout(_.random(2000, 7000))
      }

      const iterationResults = await ctx.call('ig.feeds.accountFollowers', { igAccount, feedId: igAccount.igAccountId, cursor })
      if (iterationResults.code !== 200) throw new Error(iterationResults)

      cursor = iterationResults.data.cursor || null
      moreAvailable = iterationResults.data.moreAvailable || false
      accounts = iterationResults.data.accounts || []

      const addFollowersResult = await ctx.broker.call('list.accounts.followers.add', { from: accounts.map(a => a.igId), to: igAccount.igAccountId })
      if (addFollowersResult.code !== 200) throw new Error(addFollowersResult)
    } while (moreAvailable)

    // 3. update our model
    await InstagramAccount.collection.findOneAndUpdate({
      igAccountId: igAccount.igAccountId,
    }, {
      $set: {
        'cycle.followersUpdatedAt': DateTime.utc().toJSDate(),
      },
    })
  }

  await action.forwardState(igAccount, 'planner', false)
  return new OkResponse()
}

module.exports = action

