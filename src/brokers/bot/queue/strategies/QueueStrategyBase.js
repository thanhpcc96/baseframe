

const _ = require('lodash')
const { DateTime } = require('luxon')
const mongoose = require('mongoose')

const { MoleculerConflictDataError } = rootRequire('./src/errors')

const InstagramAccount = mongoose.model('InstagramAccount')

module.exports = class QueueStrategyBase {
  static async addJob(igAccountId, queueName, job) {
    throw new Error('method not implemented.')
  }

  // helper
  static async findIgAccountAndCheckNoError(igAccountId) {
    const igAccountFound = await InstagramAccount.findOne({ igAccountId }).exec()

    if (!igAccountFound || igAccountFound.error !== null) {
      throw new MoleculerConflictDataError('There is an error on this IgAccount')
    }

    return igAccountFound
  }

  // helper
  /*
  static async invalidateAllNeededJobs(igAccountId, queueName, job) {
    // arrayfilter is not yet supported by node mongo driver so neither is mongoose
    // we have to use -> command raw method of node mongo driver
    // see https://stackoverflow.com/questions/47225132/update-nested-subdocuments-in-mongodb-with-arrayfilters

    if (_.isEmpty(job.commandsToInvalidate)) {
      return null
    }

    if (!_.isDate(job.runAt)) {
      throw new Error(`job.runAt is not a date valid, job.runAt: ${job.runAt}`)
    }

    const query = {
      igAccountId,
    }

    const update = {
      $set: {},
    }

    update.$set[`queues.${queueName}.$[elem].status`] = 'invalidated'

    const arrayFilters = [{
      'elem.status': 'enqueue',
      'elem.command': {
        $in: job.commandsToInvalidate,
      },
      'elem.runAt': {
        $lte: job.runAt,
      },
    }]

    return mongoose.connection.db.command({
      update: InstagramAccount.collection.name,
      updates: [
        {
          q: query,
          u: update,
          multi: true,
          arrayFilters,
        },
      ],
    })
  }
  */

  // helper
  static async removeCompletedJobs(igAccountId, queueName) {
    const filter = {
      igAccountId,
    }

    const update = {
      $pull: {},
    }

    update.$pull[`queues.${queueName}`] = {
      status: {
        $in: ['completed', 'invalidated', 'failed'],
      },
      $or: [{
        finishedAt: {
          $lte: DateTime.utc().minus({
            minutes: 10,
          }).toJSDate(),
        },
      }, {
        finishedAt: null,
      }],
    }

    return InstagramAccount.collection.update(filter, update)
  }

  // helper
  static async addJobToInstagramAccount(igAccountId, queueName, job) {
    const filter = {
      igAccountId,
    }

    const update = {
      $push: {},
    }

    update.$push[`queues.${queueName}`] = {
      $each: [{
        command: job.command,
        status: job.status,
        payload: job.payload,
        runAt: job.runAt,
      }],
      $sort: {
        runAt: 1,
      },
    }

    const options = {
      new: true,
    }

    return InstagramAccount.findOneAndUpdate(filter, update, options).exec()
  }

  // action drain
  static async drainJobs(igAccountId, queueName) {
    const query = {
      igAccountId,
    }

    const update = {
      $set: {},
    }

    update.$set[`queues.${queueName}.$[elem].status`] = 'invalidated'

    const arrayFilters = [{
      'elem.status': {
        $in: ['enqueue', 'completed'],
      },
    }]

    return mongoose.connection.db.command({
      update: InstagramAccount.collection.name,
      updates: [
        {
          q: query,
          u: update,
          multi: true,
          arrayFilters,
        },
      ],
    })
  }
}

