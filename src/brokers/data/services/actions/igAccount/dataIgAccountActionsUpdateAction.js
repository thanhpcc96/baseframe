

const mongoose = require('mongoose')
const { DateTime } = require('luxon')

const { OkResponse } = rootRequire('./src/models')
const { MoleculerEntityNotFoundError, MoleculerConflictDataError } = rootRequire('./src/errors')

module.exports = {
  params: {
    igAccountId: 'string',
    userId: 'string',
    full: {
      type: 'boolean',
      optional: true,
    },
    likes: 'boolean',
    comments: 'boolean',
    follows: 'boolean',
    unfollows: 'boolean',
  },
  handler(ctx) {
    const { userId, igAccountId } = ctx.params

    const full = !!ctx.params.full

    const {
      likes, comments, follows, unfollows,
    } = ctx.params

    const InstagramAccount = mongoose.model('InstagramAccount')
    let igAccount = null

    // helper
    function findIgAccount() {
      return InstagramAccount.findOne({
        _id: igAccountId,
        owner: userId,
      }).exec().then((igAccountFound) => {
        if (igAccountFound) {
          igAccount = igAccountFound
          return Promise.resolve()
        }
        return Promise.reject(new MoleculerEntityNotFoundError('igAccount'))
      })
    }

    // helper
    function updateActivities() {
      igAccount.configuration.actions.likes = likes
      igAccount.configuration.actions.comments = comments
      igAccount.configuration.actions.follows = follows
      igAccount.configuration.actions.unfollows = unfollows
      return igAccount.save()
    }

    // helper
    function notifyUpdated() {
      const payload = {
        igAccountId,
        time: Date.now(),
      }

      return ctx.call('data.igAccount.notifyUpdated', payload)
    }

    return Promise.resolve()
      .then(findIgAccount)
      .then(updateActivities)
      .then(notifyUpdated)
      .then(() => new OkResponse('igAccount', { igAccount: igAccount.toApi({ full }) }))
  },
}

