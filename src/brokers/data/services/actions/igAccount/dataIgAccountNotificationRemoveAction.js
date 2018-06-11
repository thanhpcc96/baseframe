

const mongoose = require('mongoose')
const { DateTime } = require('luxon')

const { MoleculerEntityNotFoundError, MoleculerConflictDataError } = rootRequire('./src/errors')
const { OkResponse } = rootRequire('./src/models')

module.exports = {
  params: {
    igAccountId: 'string',
    notificationId: 'string',
    userId: 'string',
  },
  async handler(ctx) {
    const { igAccountId, notificationId, userId } = ctx.params
    const InstagramAccount = mongoose.model('InstagramAccount')

    const igAccount = await InstagramAccount.findOneAndUpdate({
      _id: igAccountId,
      owner: userId,
    }, {
      $pull: { notifications: { _id: notificationId } },
    }, {
      new: true,
    }).exec()

    if (!igAccount) { throw new MoleculerEntityNotFoundError('igAccount') }

    return new OkResponse('igAccount', { igAccount })
  },
}

