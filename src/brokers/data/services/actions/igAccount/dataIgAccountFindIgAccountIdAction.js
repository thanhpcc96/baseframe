
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
    const { igAccountId, full } = ctx.params

    const igAccount = await InstagramAccount.findOne({ igAccountId }).exec()

    if (igAccount) {
      return new FoundResponse('igAccount', { igAccount: igAccount.toApi({ full }) })
    }
    throw new MoleculerEntityNotFoundError('igAccount')
  },
}
