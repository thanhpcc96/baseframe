

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

  await action.saveCurrentState(igAccount, 'planner')
  const nextState = await getNextAction(ctx, igAccount)
  await action.forwardState(igAccount, nextState, false)

  return new OkResponse()
}

module.exports = action

/**
 * [getNextAction description]
 * @param  {[type]} igAccount [description]
 * @return {[type]}           [description]
 */
async function getNextAction(ctx, igAccount) {
  // helpers
  const canDoAttackNext = () => igAccount.cycle.counters.attacksOnStep < igAccount.cycle.configuration.calculated.attacksInRow
  const canDoUnattackNext = () => igAccount.cycle.counters.unattacksOnStep < igAccount.cycle.configuration.calculated.unattacksInRow
  const isThereAttackReady = () => !_.isEmpty(igAccount.cycle.ready.attack.accounts) || !_.isEmpty(igAccount.cycle.ready.attack.medias)
  const isThereUnattackReady = () => !_.isEmpty(igAccount.cycle.ready.unattack.accounts)

  // is this last step? ohh yeah
  if (action.areCyclesFinished(igAccount)) {
    return 'end'
  }

  // all disabled => message to user and stop
  if (!action.attackActive(igAccount) && !action.unattackActive(igAccount)) {
    await ctx.broker.call('data.igAccount.notification.create', { igAccountId: igAccount.igAccountId, type: 'noMoreActionsToDo' })
    return 'stop'
  }

  // attack
  if (isThereAttackReady()) {
    return 'switchAttack'
  }

  // unattack
  if (isThereUnattackReady()) {
    return 'unattack'
  }

  // scrap
  if (action.attackActive(igAccount) && canDoAttackNext()) {
    return getAttackSource(ctx, igAccount)
  } else if (action.unattackActive(igAccount) && canDoUnattackNext()) {
    return 'searchSomeFollowings'
  }

  // reset
  await resetIgAccountStepCounters(igAccount)
  return 'planner'
}

/**
 * [resetIgAccountStepCounters description]
 * @param  {[type]} igAccount [description]
 * @return {[type]}           [description]
 */
function resetIgAccountStepCounters(igAccount) {
  return InstagramAccount.collection.findOneAndUpdate({
    igAccountId: igAccount.igAccountId,
  }, {
    $set: {
      'igAccount.cycle.counters.attacksOnStep': 0,
      'igAccount.cycle.counters.unattacksOnStep': 0,
    },
  })
}

/**
 * [getAttackSource description]
 * @param  {[type]} igAccount [description]
 * @return {[type]}           [description]
 */
async function getAttackSource(ctx, igAccount) {
  switch (igAccount.cycle.configuration.sources.attack) {
  case 'all': {
    const response = await ctx.broker.call('bot.decisions.attackSource.select', { igAccount })
    if (response.code !== 200) { throw response }

    const selectedArm = response.data[response.type]
    if (!['searchFeed', 'switchAudience'].includes(selectedArm)) throw new Error(`decision arm is unknown, arm:${selectedArm}`)

    return selectedArm
  }
  case 'feed':
    return 'searchFeed'
  case 'audience':
    return 'switchAudience'
  default:
    throw new Error('wrong state')
  }
}
