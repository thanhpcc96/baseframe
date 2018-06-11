

const _ = require('lodash')
const mongoose = require('mongoose')

const { MoleculerEntityNotFoundError } = rootRequire('./src/errors')
const { CreatedResponse } = rootRequire('./src/models')

/**
 * Register a new user
 */

module.exports = {
  params: {
    userId: 'string',
    audienceId: 'string',
    name: 'string',
  },
  handler(ctx) {
    const userId = ctx.params.userId
    const audienceId = ctx.params.audienceId
    const name = ctx.params.name

    const Audience = mongoose.model('Audience')
    let audience = null

    // helper
    function getAudience() {
      return Audience
        .findOne({
          _id: audienceId,
          owner: userId,
        })
        .exec()
        .then((audienceFound) => {
          if (audienceFound) {
            audience = audienceFound
            return Promise.resolve()
          }
          return Promise.reject(new MoleculerEntityNotFoundError('audience'))
        })
    }

    // helper
    function updateAudience() {
      audience.name = name
      return audience.save()
    }

    return Promise.resolve()
      .then(getAudience)
      .then(updateAudience)
      .then(() => new CreatedResponse('audience', { audience: audience.toApi() }))
  },
}

