

const mongoose = require('mongoose')
const { DateTime } = require('luxon')

const { MoleculerEntityNotFoundError } = rootRequire('./src/errors')
const { OkResponse } = rootRequire('./src/models')

/**
 * Register a new user
 */

module.exports = {
  params: {
    audienceId: 'string',
    time: 'number',
  },
  handler(ctx) {
    const { audienceId, time } = ctx.params

    if (!DateTime.fromMillis(time).isValid) {
      throw new Error('Time not valid')
    }

    const Audience = mongoose.model('Audience')
    const InstagramAccount = mongoose.model('InstagramAccount')

    // helper
    function checkAudience() {
      return Audience
        .findOne({
          _id: audienceId,
        })
        .exec()
        .then((audienceFound) => {
          if (audienceFound) {
            return Promise.resolve()
          }
          return Promise.reject(new MoleculerEntityNotFoundError('audience'))
        })
    }

    // helper
    function getIgAccountUsingAudience() {
      return InstagramAccount
        .find({
          'configuration.audience': audienceId,
        })
        .exec()
    }

    // helper
    function notifyBot(igAccounts) {
      return Promise.all(igAccounts.map((igAccount) => {
        if (igAccount.isActivityStarted()) {
          return ctx.call('bot.control.restart', {
            igAccount: {
              igAccountId: igAccount.igAccountId,
            },
            time,
          })
        }
        return Promise.resolve()
      }))
    }

    // action
    return Promise.resolve()
      .then(checkAudience)
      .then(getIgAccountUsingAudience)
      .then(notifyBot)
      .then(() => new OkResponse())
  },
}

