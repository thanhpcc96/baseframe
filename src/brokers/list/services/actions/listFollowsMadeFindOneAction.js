

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
    madeBeforeAt: {
      type: 'number',
      optional: true,
    },
  },
  async handler(ctx) {
    const { from, to, madeBeforeAt } = ctx.params
    const ListAccountFollowingsMade = mongoose.model('ListAccountFollowingsMade')

    const query = {
      from,
      follows: {
        $elemMatch: {
          to,
        },
      },
    }

    if (madeBeforeAt && madeBeforeAt > 0) {
      query.follows.$elemMatch.madeAt = { $lte: new Date(madeBeforeAt) }
    }

    const resultsFind = await ListAccountFollowingsMade.findOne(query).exec()

    if (resultsFind) {
      return new FoundResponse()
    }

    return new NotFoundResponse('followsEntry')
  },
}

