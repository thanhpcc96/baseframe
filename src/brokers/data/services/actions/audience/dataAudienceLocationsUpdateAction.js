

const _ = require('lodash')
const mongoose = require('mongoose')
const { DateTime } = require('luxon')

const { MoleculerEntityNotFoundError } = rootRequire('./src/errors')
const { CreatedResponse } = rootRequire('./src/models')

/**
 * Register a new user
 */

module.exports = {
  params: {
    userId: 'string',
    audienceId: 'string',
    locations: {
      type: 'array',
      items: {
        type: 'object',
        props: {
          igId: {
            type: 'string',
          },
          title: {
            type: 'string',
          },
          subtitle: {
            type: 'string',
            optional: true,
          },
          lat: {
            type: 'number',
          },
          lng: {
            type: 'number',
          },
          address: {
            type: 'string',
            optional: true,
          },
          city: {
            type: 'string',
            optional: true,
          },
          state: {
            type: 'string',
            optional: true,
          },

        },

      },
    },
  },
  async handler(ctx) {
    const { userId, audienceId, locations } = ctx.params
    const Audience = mongoose.model('Audience')

    const audience = await Audience.findOne({ _id: audienceId, owner: userId }).exec()
    if (!audience) throw new MoleculerEntityNotFoundError('audience')

    audience.locations = locations
    await audience.save()

    await ctx.call('data.audience.updated', { audienceId: audience._id.toString(), time: Date.now() })

    return new CreatedResponse('audience', { audience: audience.toApi() })
  },
}

