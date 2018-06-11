

const mongoose = require('mongoose')

const { MoleculerEntityNotFoundError } = rootRequire('./src/errors')
const { OkResponse } = rootRequire('./src/models')

module.exports = {
  params: {
    igAccount: {
      type: 'object',
      props: {
        igAccountId: 'string',
      },
    },
  },
  async handler(ctx) {
    const igAccountId = ctx.params.igAccount.igAccountId
    const InstagramAccount = mongoose.model('InstagramAccount')

    const igAccountFound = await InstagramAccount
      .findOne({ igAccountId })
      .populate('configuration.audience')
      .populate('owner')
      .exec()

    if (igAccountFound) {
      return new OkResponse('igAccountConfiguration', { igAccountConfiguration: igAccountFound.getConfiguration() })
    }

    throw new MoleculerEntityNotFoundError('igAccount')
  },
}

