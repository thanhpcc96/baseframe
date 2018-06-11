

const mongoose = require('mongoose')
const _ = require('lodash')

const { OkResponse } = rootRequire('./src/models')
const Queue = rootRequire('./src/brokers/bot/queue/Queue')

const { MoleculerConflictDataError } = rootRequire('./src/errors')

module.exports = {
  params: {
    igAccount: {
      type: 'object',
      props: {
        igAccountId: 'string',
        cookies: { type: 'array', optional: true },
        username: 'string',
      },
    },
  },
  async handler(ctx) {
    const {
      igAccountId, cookies, username,
    } = ctx.params.igAccount
    const InstagramAccount = mongoose.model('InstagramAccount')

    // 1. already here?
    let igAccount = await InstagramAccount.findOne({ igAccountId }).exec()

    if (_.isEmpty(igAccount)) {
      // 2. create
      igAccount = new InstagramAccount()
      igAccount.igAccountId = igAccountId
    }

    igAccount.username = username

    if (!_.isEmpty(cookies)) {
      igAccount.cookies = cookies
    }

    await igAccount.save()

    if (!_.isEmpty(cookies)) {
      await Queue.add('management', 'fetch', igAccountId)
    }

    return new OkResponse('igAccount', { igAccount })
  },
}

