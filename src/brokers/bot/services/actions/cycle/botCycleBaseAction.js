

const mongoose = require('mongoose')
const _ = require('lodash')
const { DateTime } = require('luxon')

const utils = rootRequire('./src/utils')
const Queue = rootRequire('./src/brokers/bot/queue/Queue')
const { OkResponse } = rootRequire('./src/models')
const config = rootRequire('config')

const { MoleculerEntityNotFoundError, MoleculerConflictDataError, MoleculerInternalError } = rootRequire('./src/errors')

const InstagramAccount = mongoose.model('InstagramAccount')

/**
 * [getTimeToWait description]
 * @param  {[type]} igAccount [description]
 * @return {[type]}           [description]
 */
function getTimeToWait(igAccount) {
  const delay = _.random(10, 20)

  /*
  if (config.isDevelopment()) {
    return delay
  }
  */

  let time = delay
  switch (igAccount.cycle.configuration.speed) {
  case -1:
    // slow => 30 req/h = 120s
    time += 120
    break
  case 0:
    // normal => 40 req/h => 90s
    time += 90
    break
  case 1:
    // fast => 50 req/h => 72s
    time += 72
    break
  default:
    throw new Error('Invalid speed :/')
  }

  return time
}

function checkMediasDataLimitReachedOfIteration(ctx, dateLimit, mediasIn = []) {
  const medias = _.castArray(mediasIn)

  if (_.isEmpty(medias)) {
    return false
  }

  const earlierTakenAt = _.minBy(medias, m => m.takenAt)

  if (earlierTakenAt.takenAt === undefined || earlierTakenAt.takenAt === null || earlierTakenAt.takenAt <= 0 || !_.isNumber(earlierTakenAt.takenAt)) {
    throw new Error(`invalid takenAt, earlierTakenAt:${earlierTakenAt}`)
  }

  const takenAt = DateTime.fromMillis(earlierTakenAt.takenAt)

  if (takenAt.isValid !== true) {
    throw new Error(`Luxon date is not valid, takenAt:${takenAt}`)
  }

  ctx.broker.logger.debug('checkDataLimitReachedOfIteration', {
    takenAt: takenAt.toISO(),
    dateLimit: dateLimit.toISO(),
  })

  return dateLimit.valueOf() > takenAt.valueOf()
}

async function filterAcquisitionMedias(ctx, igAccount, mediasIn = []) {
  const medias = _.castArray(mediasIn)
  const response = await ctx.call('filter.acquisition.medias', { igAccount, medias })
  if (response.code !== 200) { throw new Error(response) }
  return response.data[response.type]
}

async function filterAcquisitionAccounts(ctx, igAccount, accountsIn = []) {
  const accounts = _.castArray(accountsIn)
  if (_.isEmpty(accounts)) { return accounts }
  const response = await ctx.call('filter.acquisition.accounts', { igAccount, accounts })
  if (response.code !== 200) { throw new Error(response) }
  return response.data[response.type]
}

async function filterDisposalAccounts(ctx, igAccount, accountsIn = []) {
  const accounts = _.castArray(accountsIn)
  if (_.isEmpty(accounts)) { return accounts }
  const response = await ctx.call('filter.disposal.accounts', { igAccount, accounts })
  if (response.code !== 200) { throw new Error(response) }
  return response.data[response.type]
}

// forwardState
function forwardState(igAccount, state, waitTimeToNextTick = false) {
  const nextTickAt = DateTime.utc().plus({
    seconds: waitTimeToNextTick === true ? getTimeToWait(igAccount) : 0,
  }).toJSDate()

  return Queue.add('cycle', state, igAccount.igAccountId, nextTickAt)
}

// drainIgAccountQueue
function drainIgAccountQueue(igAccount) {
  return Queue.drain('cycle', igAccount.igAccountId)
}

// saveCurrentState
async function saveCurrentState(igAccount, state) {
  const result = await InstagramAccount.collection.findOneAndUpdate({
    igAccountId: igAccount.igAccountId,
  }, {
    $set: {
      'cycle.state': state,
    },
  }, {
    new: true,
  })

  return result
}

// saveInstagramAccountsReadyToUnattack
function saveInstagramAccountsReadyToUnattack(ctx, igAccount, accountsIn) {
  const accounts = _.castArray(accountsIn)

  ctx.broker.logger.debug('botCycleBaseAction - saveInstagramAccountsReadyToUnattack, ', { accounts })

  return InstagramAccount.collection.findOneAndUpdate({
    igAccountId: igAccount.igAccountId,
  }, {
    $set: {
      'cycle.ready.unattack.accounts': accounts,
    },
  }).then(() => Promise.resolve(accounts))
}

async function saveReadyToAttack(ctx, igAccount, scrapped) {
  ctx.broker.logger.debug('botCycleBaseAction - saveReadyToAttack, ', { scrapped })

  // check not empty
  if (_.isEmpty(scrapped.medias) && _.isEmpty(scrapped.accounts)) {
    ctx.broker.logger.debug('botCycleBaseAction - saveReadyToAttack - scrapped.medias && scrapped.accounts are empty!')
    return scrapped
  }

  // check accounts format
  _.forEach(scrapped.accounts, (a) => {
    if (_.isEmpty(a.igId) || _.isEmpty(a.username)) {
      throw new Error('scrapped.accounts has a bad format :/')
    }
  })

  // check medias format
  _.forEach(scrapped.medias, (m) => {
    if (_.isEmpty(m.igId)) {
      throw new Error('scrapped.medias has a bad format :/')
    }
  })

  await InstagramAccount.collection.findOneAndUpdate({
    igAccountId: igAccount.igAccountId,
  }, {
    $set: {
      'cycle.ready.attack.accounts': scrapped.accounts,
      'cycle.ready.attack.medias': scrapped.medias,
    },
  })

  return scrapped
}

async function attackSourceDecisionReward(ctx, igAccount, arm, reward) {
  const response = await ctx.broker.call('bot.decisions.attackSource.reward', { igAccount, arm, reward })

  if (response.code !== 200) {
    throw new MoleculerInternalError('Error saving attack reward', response)
  }

  return response
}

// iterateAudienceFeed
async function iterateAudienceFeed(ctx, igAccount, feedName, feedId) {
  feedName = feedName.toString()
  feedId = feedId.toString()

  const feeds = ['location', 'hashtag', 'accountFollowers', 'timeline']
  if (!feeds.includes(feedName)) {
    throw new Error(`feedName is not valid, feedName: ${feedName}`)
  }

  // helpers
  const isMediasFeed = () => feedName === 'timeline' || feedName === 'location' || feedName === 'hashtag'
  const isAccountsFeed = () => feedName === 'accountFollowers'
  const equalsArrays = (array1, array2) => _.isEqual([...array1].sort(), [...array2].sort())

  // limits
  // const accountsLimit = _.random(1, 2)
  // const mediasLimit = _.random(1, 3)
  const accountsLimit = 1
  const mediasLimit = 1
  const dateLimit = DateTime.utc().minus({ milliseconds: igAccount.cycle.configuration.filters.media.age })

  // totals
  let allAccounts = []
  let allMedias = []

  // every loop
  let cursor = null
  let iteration = 0
  let medias = null
  let accounts = null
  let dateLimitReached = false
  let moreAvailable = true

  // used to control the ig feed bug
  let lastIterationResults = []

  // debug
  ctx.broker.logger.debug('iterateAudienceFeed - start', {
    feedName,
    feedId,
    dateLimit: dateLimit.toISO(),
  })

  // iterator
  do {
    iteration += 1

    // debug
    ctx.broker.logger.debug('iterateAudienceFeed - iteration', {
      feedName,
      feedId,
      cursor,
      iteration,
      dateLimit: dateLimit.toISO(),
      moreAvailable,
      dateLimitReached,
      allAccounts,
      allMedias,
    })

    if (iteration > 1) {
      await utils.timeout(_.random(3000, 7000))
    }

    // - 0 make iteration
    const iterationResults = await ctx.call(`ig.feeds.${feedName}`, {
      igAccount,
      feedId,
      cursor,
    })

    if (iterationResults.code !== 200) {
      throw new Error(iterationResults)
    }

    cursor = iterationResults.data.cursor || null
    moreAvailable = iterationResults.data.moreAvailable || false
    medias = iterationResults.data.medias || []
    accounts = iterationResults.data.accounts || []

    // control infinity feed (ig bug feed)
    if (moreAvailable === true) {
      if (!_.isEmpty(medias)) {
        moreAvailable = !equalsArrays(medias.map(m => m.igId), lastIterationResults.map(m => m.igId))
        lastIterationResults = medias
      } else if (!_.isEmpty(accounts)) {
        moreAvailable = !equalsArrays(accounts.map(a => a.igId), lastIterationResults.map(a => a.igId))
        lastIterationResults = accounts
      }
    }

    // debug
    ctx.broker.logger.debug('iterateAudienceFeed - feed result', {
      feedName, feedId, iteration, cursor, moreAvailable, medias, accounts,
    })

    // - 1
    dateLimitReached = !_.isEmpty(medias) && checkMediasDataLimitReachedOfIteration(ctx, dateLimit, medias)

    // - 2
    if (isMediasFeed()) {
      // medias
      const mediasFiltered = await filterAcquisitionMedias(ctx, igAccount, medias)
      allMedias = allMedias.concat(mediasFiltered)

      // medias owners
      const mediasOwnersFiltered = await filterAcquisitionAccounts(ctx, igAccount, medias.map(m => m.igAccount))
      allAccounts = allAccounts.concat(mediasOwnersFiltered)

      // medias likers
      // media comenters
    } else if (isAccountsFeed()) {
      const accountsFiltered = await filterAcquisitionAccounts(ctx, igAccount, accounts)
      allAccounts = allAccounts.concat(accountsFiltered)
    } else {
      throw new Error('Type not valid')
    }

    // - 3 ensure uniques
    allMedias = _.uniqWith(allMedias, (arrVal, othVal) => arrVal.igId === othVal.igId)
    allAccounts = _.uniqWith(allAccounts, (arrVal, othVal) => arrVal.igId === othVal.igId)
  } while (moreAvailable && !dateLimitReached && (allAccounts.length < accountsLimit && allMedias.length < mediasLimit))

  // ensure correct sizes
  allAccounts = allAccounts.slice(0, accountsLimit)
  allMedias = allMedias.slice(0, mediasLimit)

  // debug
  ctx.broker.logger.debug('iterateAudienceFeed - end', {
    feedName,
    feedId,
    cursor,
    iteration,
    dateLimit: dateLimit.toISO(),
    moreAvailable,
    dateLimitReached,
    allAccounts,
    accountsLimit,
    allMedias,
    mediasLimit,
  })

  return { medias: allMedias, accounts: allAccounts }
}

// addHistoricEntry
async function addHistoricEntry(ctx, igAccount, actionName, payload = null, time = Date.now()) {
  return ctx.broker.call('historical.add.entry', {
    igAccountId: igAccount.igAccountId,
    action: actionName,
    payload,
    time,
  })
}

// areCyclesFinished
function areCyclesFinished(igAccount) {
  const allAttacksDone = igAccount.cycle.counters.attacksTotal >= igAccount.cycle.configuration.cycleSize.attack
  const allUnattacksDone = igAccount.cycle.counters.unattacksTotal >= igAccount.cycle.configuration.cycleSize.unattack
  if (attackActive(igAccount) && unattackActive(igAccount)) {
    return allAttacksDone || allUnattacksDone
  } else if (attackActive(igAccount)) {
    return allAttacksDone
  } else if (unattackActive(igAccount)) {
    return allUnattacksDone
  }
  throw new Error('bad state')
}

// attackActive
function attackActive(igAccount) {
  return igAccount.cycle.configuration.actions.follows === true ||
  igAccount.cycle.configuration.actions.likes === true
}

// unattackActive
function unattackActive(igAccount) {
  return igAccount.cycle.configuration.actions.unfollows === true
}

// increaseAttackCounters
function increaseAttackCounters(ctx, igAccount, increase = 1) {
  return InstagramAccount.collection.findOneAndUpdate({
    igAccountId: igAccount.igAccountId,
  }, {
    $inc: {
      'cycle.counters.attacksOnStep': increase,
      'cycle.counters.attacksTotal': increase,
    },
  })
}
// increaseUnattackCounters
function increaseUnattackCounters(ctx, igAccount, increase = 1) {
  return InstagramAccount.collection.findOneAndUpdate({
    igAccountId: igAccount.igAccountId,
  }, {
    $inc: {
      'cycle.counters.unattacksOnStep': increase,
      'cycle.counters.unattacksTotal': increase,
    },
  })
}

/**
 * [exports description]
 * @type {Object}
 */
module.exports = {
  params: {
    igAccount: {
      type: 'object',
      props: {
        igAccountId: 'string',
        cookies: 'array',
      },
    },
  },
  handler() {
  },
  forwardState,
  saveCurrentState,
  drainIgAccountQueue,
  saveInstagramAccountsReadyToUnattack,
  saveReadyToAttack,
  attackSourceDecisionReward,
  iterateAudienceFeed,
  filterAcquisitionMedias,
  filterAcquisitionAccounts,
  filterDisposalAccounts,
  addHistoricEntry,
  areCyclesFinished,
  attackActive,
  unattackActive,
  increaseAttackCounters,
  increaseUnattackCounters,
}

