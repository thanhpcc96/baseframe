
const _ = require('lodash')
const mongoose = require('mongoose')

const { MoleculerEntityNotFoundError } = rootRequire('./src/errors')
const { FoundResponse } = rootRequire('./src/models')

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
    excludes: {
      type: 'object',
      optional: true,
    },
    filters: {
      type: 'object',
      optional: true,
    },

  },
  async handler(ctx) {
    const InstagramAccount = mongoose.model('InstagramAccount')

    const { userId, less, full } = ctx.params
    let { excludes, filters } = ctx.params

    // helper
    function filterQuey(data) {
      // only allow status
      const validQueryAttributes = ['status']
      const validStatus = ['fetching', 'ready', 'firstChallengedRequired', 'challengeRequired', 'sentryBlock', 'loginRequired']
      return _.pickBy(data, (value, key) => validQueryAttributes.includes(key) && validStatus.includes(value))
    }

    filters = filterQuey(filters || {})
    excludes = filterQuey(excludes || {})

    // build mongo query
    const query = { owner: userId }
    _.forOwn(filters, (value, key) => { query[key] = value })
    _.forOwn(excludes, (value, key) => { query[key] = { $ne: value } })

    const igAccounts = await InstagramAccount.find(query).exec()

    return new FoundResponse('igAccounts', { igAccounts: igAccounts.map(a => a.toApi({ less, full })) })
  },
}

