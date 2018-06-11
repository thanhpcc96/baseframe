

const { DateTime } = require('luxon')
const mongoose = require('mongoose')
const _ = require('lodash')

const { MoleculerConflictDataError, MoleculerInternalError, MoleculerEntityNotFoundError } = rootRequire('./src/errors')
const { OkResponse, CreatedResponse } = rootRequire('./src/models')

module.exports = async function callIgChallengeAction(ctx, userId, igAccountId, actionName, payload = {}) {
  if (!['ig.challenge.resolve', 'ig.challenge.reset', 'ig.challenge.phone', 'ig.challenge.code'].includes(actionName)) {
    throw new Error('action not supported')
  }

  const InstagramAccount = mongoose.model('InstagramAccount')
  const SmartgramUser = mongoose.model('SmartgramUser')

  const user = await SmartgramUser.findById(userId).exec()
  if (!user) { throw new MoleculerEntityNotFoundError('user') }

  const igAccount = await InstagramAccount.findById(igAccountId).exec()
  if (!igAccount) { throw new MoleculerEntityNotFoundError('igAccount') }
  if (igAccount.toJSON().owner.toString() !== userId) { throw new MoleculerEntityNotFoundError('igAccount') }

  // call
  payload = _.merge(payload, {
    country: user.country,
    deviceSeed: igAccount.challenge.session.deviceSeed,
    cookies: igAccount.challenge.session.cookies,
    challengeData: igAccount.challenge.checkpointError,
    json: igAccount.challenge.json,
  })

  const challengeResponse = await ctx.call(actionName, payload)
  if (challengeResponse.code !== 200) { throw challengeResponse }
  const challenge = challengeResponse.data[challengeResponse.type]

  return challenge
}

