

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

  await action.saveCurrentState(igAccount, 'searchAudienceAccounts')

  let accountAudience = null
  accountAudience = await findAccountUnused(ctx, igAccount)
  accountAudience = await searchAccountByUsername(ctx, igAccount, accountAudience)
  await saveAccountAsUsed(ctx, igAccount, accountAudience)
  accountAudience = await getAccountProfile(ctx, igAccount, accountAudience)

  await action.addHistoricEntry(ctx, igAccount, 'feedAccountFollowers', { username: accountAudience.username })

  if (canWeSeeAccountFollowings(accountAudience)) {
    const scrapped = await action.iterateAudienceFeed(ctx, igAccount, 'accountFollowers', accountAudience.igId)
    await action.saveReadyToAttack(ctx, igAccount, scrapped)
    await action.attackSourceDecisionReward(ctx, igAccount, 'switchAudience', scrapped.accounts.length + scrapped.medias.length)
  } else {
    ctx.broker.logger.info('searchAudienceAccounts - Skiping account we cant see followers')
    await action.attackSourceDecisionReward(ctx, igAccount, 'switchAudience', 0)
  }

  await action.forwardState(igAccount, 'switchAttack', false)
  return new OkResponse()
}

module.exports = action

async function findAccountUnused(ctx, igAccount) {
  const accountAudience = _.find(igAccount.cycle.configuration.audience.accounts, a => a.used === undefined || a.used === false)
  if (undefined === accountAudience) throw new Error('All accounts are used')
  return accountAudience
}

async function searchAccountByUsername(ctx, igAccount, accountAudience) {
  return ctx.call('ig.search.account', {
    igAccount,
    query: accountAudience.username,
  }).then((response) => {
    if (response.code !== 200) throw response
    const accounts = response.data.accounts
    const account = _.find(accounts, a => a.igId.toString() === accountAudience.igId.toString())
    if (account === undefined || account === null) throw new Error('Account not found')
    return account
  })
}

async function saveAccountAsUsed(ctx, igAccount, accountAudience) {
  const query = {
    igAccountId: igAccount.igAccountId,
  }
  const update = {
    $set: {
      'cycle.configuration.audience.accounts.$[elem].used': true,
    },
  }
  const arrayFilters = [{
    'elem.igId': accountAudience.igId.toString(),
  }]
  return mongoose.connection.db.command({
    update: InstagramAccount.collection.name,
    updates: [
      {
        q: query,
        u: update,
        multi: true,
        arrayFilters,
      },
    ],
  })
}

async function getAccountProfile(ctx, igAccount, accountAudience) {
  return ctx.call('ig.account.getById', {
    igAccount,
    accountId: accountAudience.igId.toString(),
    accountUsername: accountAudience.username.toString(),
  }).then((response) => {
    if (response.code !== 200) throw response
    return response.data[response.type]
  })
}

function canWeSeeAccountFollowings(accountAudience) {
  // isPrivate is always here
  // isBusiness maybe is not present
  if (!_.isBoolean(accountAudience.isPrivate)) {
    throw new Error('isPrivate is not present')
  }

  return accountAudience.isBusiness === true || accountAudience.isPrivate !== true
}
