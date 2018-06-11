

const mongoose = require('mongoose')
const { DateTime } = require('luxon')

const { MoleculerEntityNotFoundError } = rootRequire('./src/errors')
const { OkResponse } = rootRequire('./src/models')

module.exports = {
  params: {
    igAccountId: 'string',
    speed: 'number',
    userId: 'string',
    full: {
      type: 'boolean',
      optional: true,
    },
  },
  async handler(ctx) {
    const { igAccountId, speed, userId } = ctx.params
    const full = !!ctx.params.full

    const InstagramAccount = mongoose.model('InstagramAccount')

    const igAccount = await InstagramAccount.findOne({ _id: igAccountId, owner: userId }).exec()

    if (!igAccount) {
      throw new MoleculerEntityNotFoundError('InstagramAccount')
    }

    igAccount.configuration.speed = speed
    await igAccount.save()

    await ctx.call('data.igAccount.notifyUpdated', { igAccountId, time: Date.now() })

    return new OkResponse('igAccount', { igAccount: igAccount.toApi({ full }) })
  },
}

