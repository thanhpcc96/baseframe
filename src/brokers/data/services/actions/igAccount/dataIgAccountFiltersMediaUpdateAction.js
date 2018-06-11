

const mongoose = require('mongoose')
const { DateTime } = require('luxon')

const { MoleculerEntityNotFoundError } = rootRequire('./src/errors')
const { OkResponse } = rootRequire('./src/models')

module.exports = {
  params: {
    igAccountId: 'string',
    userId: 'string',
    age: 'number',
    full: {
      type: 'boolean',
      optional: true,
    },
  },
  handler(ctx) {
    const {
      igAccountId,
      userId,
      age,
    } = ctx.params

    const full = !!ctx.params.full

    const InstagramAccount = mongoose.model('InstagramAccount')
    let igAccount = null

    function findIgAccount() {
      return InstagramAccount.findOne({
        _id: igAccountId,
        owner: userId,
      }).exec().then((igAccountFound) => {
        if (igAccountFound) {
          igAccount = igAccountFound
          return Promise.resolve()
        }
        return Promise.reject(new MoleculerEntityNotFoundError('InstagramAccount'))
      })
    }

    function updateIgAccount() {
      igAccount.configuration.filters.media = {
        age,
      }

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
      .then(updateIgAccount)
      .then(notifyUpdated)
      .then(() => new OkResponse('igAccount', { igAccount: igAccount.toApi({ full }) }))
  },
}

