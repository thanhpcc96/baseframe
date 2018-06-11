
const { OkResponse } = rootRequire('./src/models')
const { callIgChallengeAction, updateIgAccountChallenge } = require('./../../utils')

// main handler
module.exports = {
  params: {
    userId: 'string',
    igAccountId: 'string',
    code: 'string',
    full: { type: 'boolean', optional: true },
  },
  async handler(ctx) {
    const { userId, igAccountId, code } = ctx.params
    const full = !!ctx.params.full

    // resolve ?
    // let challengeResponse = await callIgChallengeAction(ctx, userId, igAccountId, 'ig.challenge.resolve')
    // let igAccountUpdate = await updateIgAccountChallenge(ctx, igAccountId, challengeResponse.data[challengeResponse.type])

    // update code
    const challengeResponse = await callIgChallengeAction(ctx, userId, igAccountId, 'ig.challenge.code', { code })
    const igAccountUpdate = await updateIgAccountChallenge(ctx, igAccountId, challengeResponse.data[challengeResponse.type])

    return new OkResponse('igAccount', { igAccount: igAccountUpdate.toApi({ full }) })
  },
}
