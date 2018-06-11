

const mongoose = require('mongoose')
const _ = require('lodash')
const { DateTime } = require('luxon')

const { OkResponse, FoundResponse } = rootRequire('./src/models')

const { MoleculerConflictDataError, MoleculerBadRequestError } = rootRequire('./src/errors')

module.exports = {
  params: {
    igAccountId: 'string',
    startAt: 'number',
    endAt: 'number',
  },
  async handler(ctx) {
    const { igAccountId, startAt, endAt } = ctx.params

    if (startAt >= endAt) { throw new MoleculerBadRequestError('dates are not valid') }

    const startAtDate = DateTime.fromMillis(startAt)
    const endAtDate = DateTime.fromMillis(endAt)

    const pipeline = [
      { $match: { igAccountId } },
      { $unwind: { path: '$data' } },
      { $match: { 'data.takenAt': { $lte: endAtDate.toJSDate(), $gte: startAtDate.toJSDate() } } },
      { $sort: { 'data.takenAt': 1 } },
      { $project: { _id: 0, data: 1 } },
    ]

    const documents = await mongoose.model('StatisticData').collection.aggregate(pipeline).toArray()

    const data = documents.map(d => ({
      medias: d.data.medias,
      followers: d.data.followers,
      followings: d.data.followings,
      takenAt: new Date(d.data.takenAt).valueOf(),
    }))

    return new FoundResponse('statistics', {
      statistics: {
        startAt: startAtDate.valueOf(),
        endAt: endAtDate.valueOf(),
        data,
      },
    })
  },
}

