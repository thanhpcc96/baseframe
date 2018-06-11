
const _ = require('lodash')
const mongoose = require('mongoose')

const { MoleculerEntityNotFoundError } = rootRequire('./src/errors')
const { FoundResponse } = rootRequire('./src/models')

module.exports = {
  params: {
    igAccountId: 'string',
    userId: { type: 'string', optional: true },
    full: { type: 'boolean', optional: true },
  },
  async handler(ctx) {
    const InstagramAccount = mongoose.model('InstagramAccount')
    const { igAccountId, userId, full } = ctx.params

    const query = { _id: igAccountId, owner: userId }

    if (!_.isEmpty(userId)) {
      query.owner = userId
    }

    const igAccount = await InstagramAccount.findOne(query).exec()

    if (igAccount) {
      return new FoundResponse('igAccount', { igAccount: igAccount.toApi({ full }) })
    }
    throw new MoleculerEntityNotFoundError('igAccount')
  },
}
