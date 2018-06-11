

const _ = require('lodash')
const mongoose = require('mongoose')

const { OkResponse } = rootRequire('./src/models')

/**
 * Register a new user
 */

module.exports = {
  params: {
    from: { type: 'array', items: 'string' },
    to: 'string',
  },
  async handler(ctx) {
    const { from, to } = ctx.params
    const ListAccountFollowersModel = mongoose.model('ListAccountFollowers')

    await ListAccountFollowersModel.collection.findOneAndUpdate({
      to,
      followsCounter: { $lte: 1000000 },
    }, {
      $inc: { followsCounter: from.length },
      $push: { follows: { $each: from } },
    }, {
      upsert: true,
    })

    return new OkResponse()
  },
}

