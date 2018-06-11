

const mongoose = require('mongoose')
const _ = require('lodash')

const { OkResponse } = rootRequire('./src/models')

module.exports = {
  params: {
    igAccount: {
      type: 'object',
      props: {
        igAccountId: 'string',
        owner: 'string',
      },
    },
  },
  async handler(ctx) {
    const { igAccountId } = ctx.params.igAccount
    const IgAccountControlModel = mongoose.model('IgAccountControl')

    // 1. already here?
    let igAccount = await IgAccountControlModel.findOne({ igAccountId }).exec()

    if (_.isEmpty(igAccount)) {
      // 2. create
      igAccount = new IgAccountControlModel()
      igAccount.activity = 'stopped'
      igAccount.lastTakenAt = null
      igAccount.igAccountId = igAccountId

      await igAccount.save()
    }

    return new OkResponse('igAccount', { igAccount })
  },
}

