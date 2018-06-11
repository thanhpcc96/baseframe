

const mongoose = require('mongoose')

const { MoleculerEntityNotFoundError } = rootRequire('./src/errors')
const { RemovedResponse } = rootRequire('./src/models')

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
    const SmartgramUser = mongoose.model('SmartgramUser')

    let user = null
    let audience = null

    // helper
    function getUser() {
      return SmartgramUser
        .findById(userId)
        .exec()
        .then((userFound) => {
          if (userFound) {
            user = userFound
            return Promise.resolve()
          }
          return Promise.reject(new MoleculerEntityNotFoundError('user'))
        })
    }

    // helper
    function getAudience() {
      return Audience
        .findById(audienceId)
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
    function removeAudience(next) {
      audience.remove(next)
    }

    // helper
    function updateOwner(next) {
      user.audiencies.pull(audience._id)
      user.save(next)
    }

    return Promise.resolve()
      .then(getUser)
      .then(getAudience)
      .then(removeAudience)
      .then(updateOwner)
      .then(() => new RemovedResponse('audience'))
  },
}
