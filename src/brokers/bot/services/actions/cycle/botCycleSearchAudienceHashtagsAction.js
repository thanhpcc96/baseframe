

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

  await action.saveCurrentState(igAccount, 'searchAudienceHashtags')

  let hashtagAudience = await findHashtagUnused(ctx, igAccount)

  await saveHashtahAsUsed(ctx, igAccount, hashtagAudience)

  hashtagAudience = await searchHashtagByName(ctx, igAccount, hashtagAudience)

  await action.addHistoricEntry(ctx, igAccount, 'feedHashtag', { name: hashtagAudience.name })

  const scrapped = await action.iterateAudienceFeed(ctx, igAccount, 'hashtag', hashtagAudience.name)
  await action.saveReadyToAttack(ctx, igAccount, scrapped)
  await action.attackSourceDecisionReward(ctx, igAccount, 'switchAudience', scrapped.accounts.length + scrapped.medias.length)

  await action.forwardState(igAccount, 'switchAttack', false)
  return new OkResponse()
}

module.exports = action

async function findHashtagUnused(ctx, igAccount) {
  const hashtagAudience = _.find(igAccount.cycle.configuration.audience.hashtags, h => h.used === undefined || h.used === false)
  if (undefined === hashtagAudience) throw new Error('All locations are used')
  return hashtagAudience
}

async function searchHashtagByName(ctx, igAccount, hashtagAudience) {
  return ctx.call('ig.search.hashtag', {
    igAccount,
    query: hashtagAudience.name,
  }).then((response) => {
    if (response.code !== 200) throw response
    const hashtags = response.data.hashtags
    const hashtag = _.find(hashtags, h => h.igId.toString() === hashtagAudience.igId.toString())
    if (hashtag === undefined || hashtag === null) throw new Error('Hashtag not found')
    return hashtag
  })
}

async function saveHashtahAsUsed(ctx, igAccount, hashtagAudience) {
  const query = {
    igAccountId: igAccount.igAccountId,
  }
  const update = {
    $set: {
      'cycle.configuration.audience.hashtags.$[elem].used': true,
    },
  }
  const arrayFilters = [{
    'elem.igId': hashtagAudience.igId.toString(),
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
