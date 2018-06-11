

const mongoose = require('mongoose')

const { FoundResponse } = rootRequire('./src/models')

/**
 * Register a new user
 */

module.exports = {
  params: {
    userId: 'string',
    less: {
      type: 'boolean',
      optional: true,
    },
    full: {
      type: 'boolean',
      optional: true,
    },
  },
  handler(ctx) {
    const { userId, less, full } = ctx.params

    const optionsToApi = {
      less,
      full,
    }

    const Audience = mongoose.model('Audience')

    return Audience
      .find({
        owner: userId,
      })
      .exec()
      .then(audiencesFound => new FoundResponse('audiences', { audiences: audiencesFound.map(a => a.toApi(optionsToApi)) }))
  },
}

