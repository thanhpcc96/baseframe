

const { OkResponse } = rootRequire('./src/models')
const { callIgChallengeAction, updateIgAccountChallenge } = require('./../../utils')

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

    const challengeResponse = await callIgChallengeAction(ctx, userId, igAccountId, 'ig.challenge.reset')

    let igAccountUpdate = null
    switch (challengeResponse.status) {
    case 200:
      igAccountUpdate = await updateIgAccountChallenge(ctx, igAccountId, challengeResponse.data[challengeResponse.type])
      break
    case 429:
      igAccountUpdate = await updateIgAccountChallenge(ctx, igAccountId, challengeResponse.data[challengeResponse.type])
      break
    default: throw new Error('Unhandler status code')
    }

    return new OkResponse('igAccount', { igAccount: igAccountUpdate.toApi({ full }) })
  },
}
