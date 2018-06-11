const _ = require('lodash')
const mongoose = require('mongoose')

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
  await action.saveCurrentState(igAccount, 'attackLike')

  const nextMedia = igAccount.cycle.ready.attack.medias.pop()
  if (undefined === nextMedia) { return new Error('there is not media') }

  await removeMediaFromModel(ctx, igAccount, nextMedia)

  // if likes disabled - (double check, we already check this on botCycleSwitchAttackAction)
  if (igAccount.cycle.configuration.actions.likes === false) {
    return new OkResponse()
  }

  await action.addHistoricEntry(ctx, igAccount, 'mediaLike', { code: nextMedia.code })
  await action.increaseAttackCounters(ctx, igAccount)

  // secure zone
  try {
    const responseLike = await ctx.broker.call('ig.media.like', { igAccount, media: nextMedia })
    if (responseLike.code !== 200) throw responseLike
  } catch (err) {
    return handlerIgError(ctx, igAccount, err)
  }
  // end secure zone

  await action.forwardState(igAccount, 'planner', false)
  return new OkResponse()
}

module.exports = action

/**
 * [removeMediaFromModel description]
 * @param  {[type]} ctx       [description]
 * @param  {[type]} igAccount [description]
 * @param  {[type]} media     [description]
 * @return {[type]}           [description]
 */
async function removeMediaFromModel(ctx, igAccount, media) {
  await InstagramAccount.collection.findOneAndUpdate({
    igAccountId: igAccount.igAccountId,
  }, {
    $pull: {
      'cycle.ready.attack.medias': { igId: media.igId },
    },
  })
}
