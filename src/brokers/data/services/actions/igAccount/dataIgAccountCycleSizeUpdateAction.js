

const mongoose = require('mongoose')
const { DateTime } = require('luxon')

const { MoleculerEntityNotFoundError } = rootRequire('./src/errors')
const { OkResponse } = rootRequire('./src/models')

module.exports = {
  params: {
    igAccountId: 'string',
    automatic: 'boolean',
    follow: 'number',
    unfollow: 'number',
    userId: 'string',
    full: {
      type: 'boolean',
      optional: true,
    },
  },
  async handler(ctx) {
    const {
      igAccountId, automatic, userId,
    } = ctx.params

    let {
      follow, unfollow,
    } = ctx.params

    const full = !!ctx.params.full

    const InstagramAccount = mongoose.model('InstagramAccount')

    // 1. get igAccount
    const igAccount = await InstagramAccount.findOne({ _id: igAccountId, owner: userId }).exec()
    if (!igAccount) { throw new MoleculerEntityNotFoundError('InstagramAccount') }

    // 2. control config
    if (follow > 3000) follow = 3000
    if (follow < 100) follow = 100
    if (unfollow > 3000) unfollow = 3000
    if (unfollow < 100) unfollow = 100

    // 3. set and save
    igAccount.configuration.cycleSize = { automatic, follow, unfollow }
    await igAccount.save()

    // 4. notify
    await ctx.call('data.igAccount.notifyUpdated', { igAccountId, time: Date.now() })

    // all ok
    return new OkResponse('igAccount', { igAccount: igAccount.toApi({ full }) })
  },
}

