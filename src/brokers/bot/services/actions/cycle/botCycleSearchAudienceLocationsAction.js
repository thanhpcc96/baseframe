

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

  await action.saveCurrentState(igAccount, 'searchAudienceLocations')

  let locationAudience = null
  locationAudience = await findLocationUnused(ctx, igAccount)
  locationAudience = await searchLocationByName(ctx, igAccount, locationAudience)
  await saveLocationAsUsed(ctx, igAccount, locationAudience)

  await action.addHistoricEntry(ctx, igAccount, 'feedLocation', { title: locationAudience.title })

  const scrapped = await action.iterateAudienceFeed(ctx, igAccount, 'location', locationAudience.igId)
  await action.saveReadyToAttack(ctx, igAccount, scrapped)
  await action.attackSourceDecisionReward(ctx, igAccount, 'switchAudience', scrapped.accounts.length + scrapped.medias.length)

  await action.forwardState(igAccount, 'switchAttack', false)
  return new OkResponse()
}

module.exports = action

/**
 * [findLocationUnused description]
 * @param  {[type]} ctx       [description]
 * @param  {[type]} igAccount [description]
 * @return {[type]}           [description]
 */
async function findLocationUnused(ctx, igAccount) {
  const locationAudience = _.find(igAccount.cycle.configuration.audience.locations, l => l.used === undefined || l.used === false)
  if (undefined === locationAudience) throw new Error('All locations are used')
  return locationAudience
}

/**
 * [searchLocationByName description]
 * @param  {[type]} ctx              [description]
 * @param  {[type]} igAccount        [description]
 * @param  {[type]} locationAudience [description]
 * @return {[type]}                  [description]
 */
async function searchLocationByName(ctx, igAccount, locationAudience) {
  return ctx.call('ig.search.location', {
    igAccount,
    query: locationAudience.title,
  }).then((response) => {
    if (response.code !== 200) return Promise.reject(response)
    const locations = response.data.locations
    const location = _.find(locations, l => l.igId.toString() === locationAudience.igId.toString())
    if (location === undefined || location === null) throw new Error('Location not found')
    return location
  })
}

/**
 * [saveLocationAsUsed description]
 * @param  {[type]} ctx       [description]
 * @param  {[type]} igAccount [description]
 * @param  {[type]} location  [description]
 * @return {[type]}           [description]
 */
async function saveLocationAsUsed(ctx, igAccount, locationAudience) {
  const query = {
    igAccountId: igAccount.igAccountId,
  }
  const update = {
    $set: {
      'cycle.configuration.audience.locations.$[elem].used': true,
    },
  }
  const arrayFilters = [{
    'elem.igId': locationAudience.igId.toString(),
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
