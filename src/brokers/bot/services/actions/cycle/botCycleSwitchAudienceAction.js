

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

  await action.saveCurrentState(igAccount, 'switchAudience')

  const audienceState = await getNextAudienceSource(ctx, igAccount)
  await action.forwardState(igAccount, audienceState, true)
  await updateIgAccountCounters(igAccount)

  return new OkResponse()
}

module.exports = action

/**
 * [getNextAudienceSource description]
 * @param  {[type]} igAccount [description]
 * @return {[type]}           [description]
 */
async function getNextAudienceSource(ctx, igAccount) {
  let nextCycleState = null
  const audiences = []

  const isThereAudienceAccounts = () => igAccount.cycle.configuration.audience.accounts.find(a => a.used !== true) !== undefined
  const isThereAudienceHashtags = () => igAccount.cycle.configuration.audience.hashtags.find(h => h.used !== true) !== undefined
  const isThereAudienceLocations = () => igAccount.cycle.configuration.audience.locations.find(l => l.used !== true) !== undefined

  if (isThereAudienceAccounts()) audiences.push('accounts')
  if (isThereAudienceHashtags()) audiences.push('hashtags')
  if (isThereAudienceLocations()) audiences.push('locations')

  if (audiences.length > 0) {
    // return next one
    igAccount.cycle.counters.lastAudienceSource = audiences[(audiences.indexOf(igAccount.cycle.counters.lastAudienceSource) + 1) % audiences.length]
    nextCycleState = `searchAudience${capitalizeFirstLetter(igAccount.cycle.counters.lastAudienceSource)}`
  } else {
  // reset and call again
    igAccount.cycle.configuration.audience.locations.forEach(l => l.used = false)
    igAccount.cycle.configuration.audience.accounts.forEach(a => a.used = false)
    igAccount.cycle.configuration.audience.hashtags.forEach(h => h.used = false)
    nextCycleState = 'switchAudience'
  }

  ctx.broker.logger.debug(`botSwitchAudienceAction - next state: ${nextCycleState}`)

  return nextCycleState
}

/**
 * [updateIgAccountCounters description]
 * @param  {[type]} igAccount [description]
 * @return {[type]}           [description]
 */
function updateIgAccountCounters(igAccount) {
  return InstagramAccount.collection.findOneAndUpdate({
    igAccountId: igAccount.igAccountId,
  }, {
    $set: {
      'cycle.counters.lastAudienceSource': igAccount.cycle.counters.lastAudienceSource,
    },
  })
}

/**
 * [capitalizeFirstLetter description]
 * @param  {[type]} string [description]
 * @return {[type]}        [description]
 */
function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1)
}
