

const _ = require('lodash')
const mongoose = require('mongoose')
const { DateTime } = require('luxon')

const utils = rootRequire('./src/utils')
const { OkResponse } = rootRequire('./src/models')

/**
 * Register a new user
 */

module.exports = {
  params: {
    igAccountId: 'string',
    action: 'string',
    time: 'number',
    payload: {
      type: 'object',
      optional: true,
    },
  },
  async handler(ctx) {
    const {
      igAccountId, action, time, payload,
    } = ctx.params

    const timeObject = DateTime.fromMillis(time)

    ctx.broker.logger.debug('historicalAddEntryAction - new entry ', { igAccountId, action, payload })

    const Historic = mongoose.model('Historic')

    const filter = {
      igAccountId,
      week: timeObject.weekNumber,
      year: timeObject.year,
    }

    /*
    const update = {
      $set: {
        [`data.${timeObject.weekday}.${timeObject.hour}.${timeObject.minute}.${timeObject.second}`]: {
          action,
          time: timeObject.toJSDate(),
          payload,
        },
      },
    }
    */

    const update = {
      $push: {
        data: {
          $each: [{
            action,
            time: timeObject.toJSDate(),
          }],
          $position: 0,
        },
      },
    }

    if (!_.isEmpty(payload)) {
      update.$push.data.$each[0].payload = payload
    }

    const options = {
      upsert: true,
    }

    const r = await Historic.collection.updateOne(filter, update, options)

    if (r.result.ok !== 1) {
      throw new Error(r.result)
    }

    return new OkResponse('mongoResult', { mongoResult: r.result })
  },
}

