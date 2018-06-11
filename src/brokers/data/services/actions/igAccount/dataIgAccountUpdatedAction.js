
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
    igAccountId: 'string',
    time: 'number',
    updatedAudience: { type: 'boolean', optional: true },
  },
  async handler(ctx) {
    const { igAccountId, time } = ctx.params
    let { updatedAudience } = ctx.params

    // default value -> if not present then its false
    if (!_.isBoolean(updatedAudience)) {
      updatedAudience = false
    }

    if (!DateTime.fromMillis(time).isValid) {
      throw new Error('Time not valid')
    }

    // it's very important to populate the audience here!
    const igAccountFound = await mongoose.model('InstagramAccount')
      .findOne({ _id: igAccountId })
      .populate('configuration.audience')
      .exec()

    if (!igAccountFound) {
      throw new MoleculerEntityNotFoundError('igAccount')
    }

    // action
    if (igAccountFound.isActivityStarted()) {
      if (igAccountFound.isConfigurationReady()) {
        await ctx.call('bot.igAccount.restart', { igAccount: igAccountFound, time })
      } else {
        await ctx.call('data.igAccount.notification.create', { igAccountId: igAccountFound.igAccountId, type: 'restartToApplyChanges' })
      }
    }

    return new OkResponse()
  },
}

