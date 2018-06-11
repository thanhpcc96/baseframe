

const _ = require('lodash')
const mongoose = require('mongoose')

const { OkResponse } = rootRequire('./src/models')

/**
 * Register a new user
 */

module.exports = {
  params: {
    to: 'string',
  },
  async handler(ctx) {
    const { to } = ctx.params
    const ListAccountFollowersModel = mongoose.model('ListAccountFollowers')

    await ListAccountFollowersModel.collection.deleteMany({ to })

    return new OkResponse()
  },
}

