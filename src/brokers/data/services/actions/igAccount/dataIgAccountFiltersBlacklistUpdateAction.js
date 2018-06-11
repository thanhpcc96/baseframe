

const mongoose = require('mongoose')

const { MoleculerEntityNotFoundError } = rootRequire('./src/errors')
const { OkResponse } = rootRequire('./src/models')

module.exports = {
  params: {
    igAccountId: 'string',
    userId: 'string',
    full: {
      type: 'boolean',
      optional: true,
    },
    accounts: {
      type: 'array',
      items: {
        type: 'object',
        props: {
          igId: {
            type: 'string',
          },
          fullName: {
            type: 'string',
          },
          username: {
            type: 'string',
          },
          followerCount: {
            type: 'number',
          },
          profilePicUrl: {
            type: 'string',
            optional: true,
          },
        },
      },
    },
  },
  async handler(ctx) {
    const { igAccountId, userId, accounts } = ctx.params
    const full = !!ctx.params.full

    const InstagramAccount = mongoose.model('InstagramAccount')

    const igAccount = await InstagramAccount.findOne({ _id: igAccountId, owner: userId }).exec()
    if (!igAccount) { throw new MoleculerEntityNotFoundError('InstagramAccount') }

    igAccount.configuration.filters.attack.blacklist = accounts
    await igAccount.save()

    await ctx.call('data.igAccount.notifyUpdated', { igAccountId, time: Date.now() })

    return new OkResponse('igAccount', { igAccount: igAccount.toApi({ full }) })
  },
}

