

const _ = require('lodash')
const mongoose = require('mongoose')

const utils = rootRequire('./src/utils')
const { OkResponse } = rootRequire('./src/models')
const botCycleBaseAction = require('./botCycleBaseAction')
const { handlerIgError } = require('./../../utils')

const InstagramAccount = mongoose.model('InstagramAccount')

/**
 * main
 */

const action = _.defaultsDeep({}, botCycleBaseAction)

action.handler = async (ctx) => {
  const { igAccount } = ctx.params
  await action.saveCurrentState(igAccount, 'attackComplete')

  // secure zone
  try {
    let targetAccount = await getNextReadyAccount(ctx, igAccount)

    await removeAccountFromModel(ctx, igAccount, targetAccount)

    targetAccount = await getTargetAccountProfile(ctx, igAccount, targetAccount)
    const usersFiltered = await action.filterAcquisitionAccounts(ctx, igAccount, targetAccount)
    targetAccount = _.head(usersFiltered)

    // maybe after the filter the targetAccount is not valid, so we dont have account
    if (targetAccount) {
      await action.increaseAttackCounters(ctx, igAccount)

      const followsActionEnabled = () => (igAccount.cycle.configuration.actions.follows === true)
      if (followsActionEnabled()) {
        await action.addHistoricEntry(ctx, igAccount, 'accountFollow', { username: targetAccount.username })
        await followAccount(ctx, igAccount, targetAccount)
      }

      const likeActionEnabled = () => (igAccount.cycle.configuration.actions.likes === true)
      if (likeActionEnabled()) {
        await action.addHistoricEntry(ctx, igAccount, 'feedUserMedia', { username: targetAccount.username })
        await likeSomeMedias(ctx, igAccount, targetAccount)
      }
    }
  } catch (err) {
    return handlerIgError(ctx, igAccount, err)
  }
  // end secure zone

  await action.forwardState(igAccount, 'planner', false)
  return new OkResponse()
}

module.exports = action

async function getNextReadyAccount(ctx, igAccount) {
  const targetAccount = igAccount.cycle.ready.attack.accounts.pop()
  if (undefined === targetAccount) {
    throw new Error('there is not account')
  }
  return targetAccount
}

async function removeAccountFromModel(ctx, igAccount, targetAccount) {
  return InstagramAccount.collection.findOneAndUpdate({
    igAccountId: igAccount.igAccountId,
  }, {
    $pull: {
      'cycle.ready.attack.accounts': { igId: targetAccount.igId },
    },
  })
}

async function getTargetAccountProfile(ctx, igAccount, targetAccount) {
  const getAccountResponse = await ctx.broker.call('ig.account.getById', { igAccount, accountId: targetAccount.igId, accountUsername: targetAccount.username })
  if (getAccountResponse.code !== 200) { throw getAccountResponse }
  return getAccountResponse.data[getAccountResponse.type]
}

async function followAccount(ctx, igAccount, targetAccount) {
  const followResponse = await ctx.broker.call('ig.account.follow', { igAccount, targetAccount })
  if (followResponse.code !== 200) { throw followResponse }
  return targetAccount
}

async function likeSomeMedias(ctx, igAccount, targetAccount) {
  const likesActionDisabled = () => igAccount.cycle.configuration.actions.likes === false
  const isTargetPrivate = () => targetAccount.isPrivate === true

  if (likesActionDisabled() || isTargetPrivate()) {
    return targetAccount
  }

  const pageLimit = _.random(1, 3)
  let allMedias = []
  let cursor = null
  let iteration = 0
  let moreAvailable = true

  // iterator
  do {
    iteration += 1

    if (iteration > 1) {
      await utils.timeout(_.random(3000, 7000))
    }

    const userMediaResponse = await ctx.broker.call('ig.feeds.userMedia', {
      feedId: targetAccount.igId,
      igAccount,
      cursor,
    })
    if (userMediaResponse.code !== 200) { throw userMediaResponse }

    cursor = userMediaResponse.data.cursor || null
    moreAvailable = !!userMediaResponse.data.moreAvailable
    const medias = userMediaResponse.data.medias || []

    const mediasFiltered = await action.filterAcquisitionMedias(ctx, igAccount, medias)

    allMedias = allMedias.concat(mediasFiltered)
  } while (moreAvailable && iteration < pageLimit)

  // - 4 select some medias and like them
  const limitMediasToLike = _.random(1, 4)
  const mediasToLike = _.sampleSize(allMedias, limitMediasToLike)

  for (let i = mediasToLike.length - 1; i >= 0; i -= 1) {
    // 1. historic
    await action.addHistoricEntry(ctx, igAccount, 'mediaLike', { code: mediasToLike[i].code })

    // 2. like ig action
    const responseLike = await ctx.broker.call('ig.media.like', { igAccount, media: mediasToLike[i] })
    if (responseLike.code !== 200) { throw responseLike }
  }

  return targetAccount
}

