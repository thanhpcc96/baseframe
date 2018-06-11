

const _ = require('lodash')
const mongoose = require('mongoose')

const { FoundResponse, NotFoundResponse } = rootRequire('./src/models')

/**
 * Register a new user
 */

module.exports = {
  params: {
    from: 'string',
    to: 'string',
  },
  async handler(ctx) {
    const { from, to } = ctx.params
    const ListAccountFollowersModel = mongoose.model('ListAccountFollowers')

    const query = {
      to,
      follows: from,
    }

    const resultsFind = await ListAccountFollowersModel.collection.findOne(query)

    if (resultsFind) {
      return new FoundResponse()
    }

    return new NotFoundResponse('ListAccountFollowers')
  },
}

