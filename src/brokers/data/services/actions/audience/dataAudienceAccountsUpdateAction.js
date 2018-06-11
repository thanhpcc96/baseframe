

const _ = require('lodash')
const mongoose = require('mongoose')
const { DateTime } = require('luxon')

const { MoleculerEntityNotFoundError } = rootRequire('./src/errors')
const { OkResponse } = rootRequire('./src/models')

/**
 * Register a new user
 */

module.exports = {
  params: {
    userId: 'string',
    audienceId: 'string',
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
            optional: true,
          },
          username: {
            type: 'string',
          },
          followerCount: {
            type: 'number',
            optional: true,
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
    const { userId, audienceId, accounts } = ctx.params
    const Audience = mongoose.model('Audience')

    const audience = await Audience.findOne({ _id: audienceId, owner: userId }).exec()
    if (!audience) { throw new MoleculerEntityNotFoundError('audience') }

    audience.accounts = accounts
    await audience.save()

    await ctx.call('data.audience.updated', { audienceId: audience._id.toString(), time: Date.now() })

    return new OkResponse('audience', { audience: audience.toApi() })
  },
}

