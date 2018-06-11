

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

  await action.saveCurrentState(igAccount, 'unattack')

  let targetAccount = await getNextReadyAccount(ctx, igAccount)

  await removeAccountFromModel(ctx, igAccount, targetAccount)

  targetAccount = await getTargetAccountProfile(ctx, igAccount, targetAccount)
  const usersFiltered = await action.filterDisposalAccounts(ctx, igAccount, targetAccount)
  targetAccount = _.head(usersFiltered)

  // maybe after the filter the targetAccount is not valid, so we dont have account
  if (targetAccount) {
    await action.increaseUnattackCounters(ctx, igAccount)

    const unfollowsActionEnabled = () => (igAccount.cycle.configuration.actions.unfollows === true)
    if (unfollowsActionEnabled()) {
      await action.addHistoricEntry(ctx, igAccount, 'accountUnfollow', { username: targetAccount.username })
      await unfollowAccount(ctx, igAccount, targetAccount)
    }
  }

  await action.forwardState(igAccount, 'planner', false)
  return new OkResponse()
}

module.exports = action


async function getNextReadyAccount(ctx, igAccount) {
  const targetAccount = igAccount.cycle.ready.unattack.accounts.pop()
  if (undefined === targetAccount) {
    throw new Error('there is not account')
  }
  return targetAccount
}

async function removeAccountFromModel(ctx, igAccount, targetAccount) {
  console.log('00000000000000000000000000000')
  return InstagramAccount.collection.findOneAndUpdate({
    igAccountId: igAccount.igAccountId,
  }, {
    $pull: {
      'cycle.ready.unattack.accounts': { igId: targetAccount.igId },
    },
  })
}

async function getTargetAccountProfile(ctx, igAccount, targetAccount) {
  console.log('111111111111111111111111111')
  console.log(targetAccount)
  const getAccountResponse = await ctx.broker.call('ig.account.getById', { igAccount, accountId: targetAccount.igId, accountUsername: targetAccount.username })
  if (getAccountResponse.code !== 200) throw new Error(getAccountResponse)
  return getAccountResponse.data[getAccountResponse.type]
}

async function unfollowAccount(ctx, igAccount, targetAccount) {
  console.log('222222222222222222222222222222')
  const followResponse = await ctx.broker.call('ig.account.unfollow', { igAccount, targetAccount })
  if (followResponse.code !== 200) throw new Error(followResponse)
  return targetAccount
}
