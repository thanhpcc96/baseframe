

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

  await action.saveCurrentState(igAccount, 'searchSomeFollowings')

  await action.addHistoricEntry(ctx, igAccount, 'feedFollowings')

  const accounts = await searchSomeFollowing(ctx, igAccount)
  await action.saveInstagramAccountsReadyToUnattack(ctx, igAccount, accounts)

  await action.forwardState(igAccount, 'controlNoMoreUnattackSources', true)
  return new OkResponse()
}

module.exports = action

/**
 * [searchSomeFollowing description]
 * @param  {[type]} ctx       [description]
 * @param  {[type]} igAccount [description]
 * @return {[type]}           [description]
 */
async function searchSomeFollowing(ctx, igAccount) {
  // every iteration
  let moreAvailable = true
  let cursor = null
  let accounts = null
  let iteration = 0

  // totals
  let selectedAccounts = []

  // used to control the ig feed bug
  let lastIterationResults = []

  // limits
  // const ACCOUNTS_LIMIT = _.random(1, 3)
  const ACCOUNTS_LIMIT = 1

  // helper
  const equalsArrays = (array1, array2) => _.isEqual([...array1].sort(), [...array2].sort())

  do {
    iteration += 1

    if (iteration > 1) {
      await utils.timeout(_.random(2000, 6000))
    }

    const iterationResults = await ctx.call('ig.feeds.followings', { igAccount, feedId: igAccount.igAccountId, cursor })
    if (iterationResults.code !== 200) throw new Error(iterationResults)

    cursor = iterationResults.data.cursor || null
    moreAvailable = iterationResults.data.moreAvailable || false
    accounts = iterationResults.data.accounts || []

    // control infinity feed (ig bug feed)
    if (moreAvailable === true && !_.isEmpty(accounts)) {
      moreAvailable = !equalsArrays(accounts.map(a => a.igId), lastIterationResults.map(a => a.igId))
      lastIterationResults = accounts
    }

    accounts = await action.filterDisposalAccounts(ctx, igAccount, accounts)
    selectedAccounts = selectedAccounts.concat(accounts)
  } while (moreAvailable && selectedAccounts.length < ACCOUNTS_LIMIT)

  return selectedAccounts.slice(-Math.abs(ACCOUNTS_LIMIT))
}

