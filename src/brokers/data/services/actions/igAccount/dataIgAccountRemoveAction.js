

const mongoose = require('mongoose')
const { DateTime } = require('luxon')

const { MoleculerEntityNotFoundError, MoleculerConflictDataError } = rootRequire('./src/errors')
const { OkResponse } = rootRequire('./src/models')


const VALID_STATUS = [
  'challengedRequired',
  'sentryBlock',
  'loginRequired',
  'fetching',
  'ready',
]

module.exports = {
  params: {
    igAccountId: 'string',
    userId: 'string',
  },
  async handler(ctx) {
    const { igAccountId, userId } = ctx.params

    const InstagramAccount = mongoose.model('InstagramAccount')

    const igAccount = await InstagramAccount.findOneAndUpdate({ igAccountId, owner: userId }, { $set: { status: 'removed' } }).exec()
    if (!igAccount) { throw new MoleculerEntityNotFoundError('igAccount') }

    return new OkResponse()
  },
}

