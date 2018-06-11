

const { OkResponse } = rootRequire('./src/models')
const { callIgChallengeAction, updateIgAccountChallenge, handlerIgErrors } = require('./../../utils')

// main handler
module.exports = {
  params: {
    userId: 'string',
    igAccountId: 'string',
    full: { type: 'boolean', optional: true },
  },
  async handler(ctx) {
    const { userId, igAccountId } = ctx.params
    const full = !!ctx.params.full

    let igAccountUpdate = null

    try {
      const challengeResponse = await callIgChallengeAction(ctx, userId, igAccountId, 'ig.challenge.resolve')
      igAccountUpdate = await updateIgAccountChallenge(ctx, igAccountId, challengeResponse.data[challengeResponse.type])
    } catch (error) {
      return handlerIgErrors(ctx, userId, igAccountId, error)
    }

    return new OkResponse('igAccount', { igAccount: igAccountUpdate.toApi({ full }) })
  },
}
