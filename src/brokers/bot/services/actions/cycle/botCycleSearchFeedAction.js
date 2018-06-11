

const _ = require('lodash')
const mongoose = require('mongoose')

const { OkResponse } = rootRequire('./src/models')
const botCycleBaseAction = require('./botCycleBaseAction')

/**
 * main
 */

const action = _.defaultsDeep({}, botCycleBaseAction)

action.handler = async (ctx) => {
  const { igAccount } = ctx.params

  await action.saveCurrentState(igAccount, 'searchFeed')

  await action.addHistoricEntry(ctx, igAccount, 'feedTimeline')

  const scrapped = await action.iterateAudienceFeed(ctx, igAccount, 'timeline', igAccount.igAccountId)
  await action.saveReadyToAttack(ctx, igAccount, scrapped)
  await action.attackSourceDecisionReward(ctx, igAccount, 'searchFeed', scrapped.accounts.length + scrapped.medias.length)

  await action.forwardState(igAccount, 'controlNoMoreAttackSources', false)
  return new OkResponse()
}

module.exports = action
