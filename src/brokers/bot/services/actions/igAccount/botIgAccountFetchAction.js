
const _ = require('lodash')
const { DateTime } = require('luxon')

const { OkResponse } = rootRequire('./src/models')
const Queue = rootRequire('./src/brokers/bot/queue/Queue')

module.exports = {
  params: {
    igAccountId: 'string',
    time: { type: 'number', optional: true },
  },
  async handler(ctx) {
    const { igAccountId } = ctx.params
    let { time } = ctx.params

    if (_.isNil(time)) {
      time = DateTime.utc().valueOf()
    }

    await Queue.add('management', 'fetch', igAccountId, time)
    return new OkResponse()
  },
}

