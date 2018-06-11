

const moment = require('moment')
const _ = require('lodash')
const mongoose = require('mongoose')
const { DateTime } = require('luxon')

const utils = rootRequire('./src/utils')
const { CreatedResponse } = rootRequire('./src/models')

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

    const ListAccountFollowingsMade = mongoose.model('ListAccountFollowingsMade')
    const madeAt = DateTime.utc().toJSDate()

    const entryFound = await ListAccountFollowingsMade.findOne({ from, 'follows.to': to })

    if (entryFound) {
      await ListAccountFollowingsMade.collection.updateOne(
        { from, 'follows.to': to },
        { $set: { 'follows.$.madeAt': madeAt } },
      )
    } else {
      await ListAccountFollowingsMade.collection.findOneAndUpdate({
        from,
        followsCounter: { $lte: 500000 },
      }, {
        $inc: { followsCounter: 1 },
        $push: { follows: { to, madeAt } },
      }, {
        upsert: true,
      })
    }

    return new CreatedResponse()
  },
}
