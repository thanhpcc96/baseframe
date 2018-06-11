

const mongoose = require('mongoose')
const _ = require('lodash')
const { DateTime } = require('luxon')

const { OkResponse } = rootRequire('./src/models')

const { MoleculerConflictDataError } = rootRequire('./src/errors')

module.exports = {
  params: {
    igAccount: {
      type: 'object',
      props: {
        igAccountId: 'string',
      },
    },
  },
  async handler(ctx) {
    const { igAccount } = ctx.params
    const { igAccountId } = ctx.params.igAccount

    const StatisticData = mongoose.model('StatisticData')

    const response = await ctx.broker.call('data.igAccount.find.igAcccountId', igAccount)
    if (response.code !== 200) {
      ctx.broker.logger.error(response)
      throw response
    }

    const igAccountData = response.data[response.type]

    await StatisticData.collection.findOneAndUpdate({
      igAccountId,
      measurements: { $lte: 400000 },
    }, {
      $inc: { measurements: 1 },
      $push: {
        data: {
          medias: igAccountData.mediaCount,
          followers: igAccountData.followerCount,
          followings: igAccountData.followingCount,
          takenAt: DateTime.utc().toJSDate(),
        },
      },
    }, {
      upsert: true,
    })


    return new OkResponse()
  },
}

