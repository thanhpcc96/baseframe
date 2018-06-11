

const _ = require('lodash')
const mongoose = require('mongoose')
const { DateTime } = require('luxon')

const utils = rootRequire('./src/utils')
const { FoundResponse } = rootRequire('./src/models')

/**
 * Register a new user
 */

module.exports = {
  params: {
    igAccountId: 'string',
    startAt: 'number',
  },
  async handler(ctx) {
    const {
      igAccountId, startAt,
    } = ctx.params

    const time = DateTime.fromMillis(startAt)

    const pipeline = [
      { $match: { igAccountId } },
      { $unwind: { path: '$data' } },
      { $match: { 'data.time': { $lt: time.toJSDate() } } },
      { $sort: { 'data.time': -1 } },
      { $limit: 70 },
      { $project: { _id: 0, data: 1 } },
    ]

    const documents = await mongoose.model('Historic').collection.aggregate(pipeline).toArray()

    const records = documents.map(d => ({
      action: d.data.action,
      payload: d.data.payload ? d.data.payload : null,
      timestamp: d.data.time,
    }))

    return new FoundResponse('records', { records })
  },
}

