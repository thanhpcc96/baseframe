

const mongoose = require('mongoose')

const { FoundResponse } = rootRequire('./src/models')

/**
 * Register a new user
 */

module.exports = {
  params: {
    userId: 'string',
    audienceId: 'string',
  },
  handler(ctx) {
    const userId = ctx.params.userId
    const audienceId = ctx.params.audienceId

    const Audience = mongoose.model('Audience')

    return Audience
      .findOne({
        _id: audienceId,
        owner: userId,
      })
      .exec()
      .then(audienceFound => new FoundResponse('audience', { audience: audienceFound.toApi(false) }))
  },
}

