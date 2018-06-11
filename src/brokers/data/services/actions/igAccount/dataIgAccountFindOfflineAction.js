
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
  },
  async handler(ctx) {
    const InstagramAccount = mongoose.model('InstagramAccount')

    const { userId, less, full } = ctx.params

    const igAccounts = await InstagramAccount.find({
      owner: userId,
      status: 'firstChallengedRequired',
    }).exec()

    return new FoundResponse('igAccounts', { igAccounts: igAccounts.map(a => a.toApi({ less, full })) })
  },
}

