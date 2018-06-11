
const mongoose = require('mongoose')

const { FoundResponse, NotFoundResponse } = rootRequire('./src/models')

module.exports = {
  params: {
    igAccountId: 'string',
  },
  async handler(ctx) {
    const InstagramAccount = mongoose.model('InstagramAccount')
    const igAccountId = ctx.params.igAccountId

    const igAccountFound = await InstagramAccount.findOne({ igAccountId }).exec()

    if (igAccountFound) {
      return new FoundResponse('igAccount', { igAccount: igAccountFound.toApi() })
    }

    return new NotFoundResponse('igAccount')
  },
}

