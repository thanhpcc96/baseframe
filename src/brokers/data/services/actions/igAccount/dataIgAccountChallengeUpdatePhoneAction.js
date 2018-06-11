

const mongoose = require('mongoose')

const { OkResponse } = rootRequire('./src/models')
const { callIgChallengeAction, updateIgAccountChallenge, handlerIgErrors } = require('./../../utils')

// main handler
module.exports = {
  params: {
    userId: 'string',
    igAccountId: 'string',
    phone: 'string',
    full: { type: 'boolean', optional: true },
  },
  async handler(ctx) {
    const { userId, igAccountId, phone } = ctx.params
    const full = !!ctx.params.full

    // in this case we store/update the phone to this igAccountId
    await mongoose.model('InstagramAccount').findOneAndUpdate({ _id: igAccountId }, { $set: { 'challenge.auth.phone': phone } }).exec()

    let igAccountUpdate = null

    try {
    // resolve
      let challengeResponse = await callIgChallengeAction(ctx, userId, igAccountId, 'ig.challenge.resolve')
      igAccountUpdate = await updateIgAccountChallenge(ctx, igAccountId, challengeResponse.data[challengeResponse.type])

      // update phone
      challengeResponse = await callIgChallengeAction(ctx, userId, igAccountId, 'ig.challenge.phone', { phone })
      igAccountUpdate = await updateIgAccountChallenge(ctx, igAccountId, challengeResponse)
    } catch (error) {
      return handlerIgErrors(ctx, userId, igAccountId, error)
    }

    return new OkResponse('igAccount', { igAccount: igAccountUpdate.toApi({ full }) })
  },
}
