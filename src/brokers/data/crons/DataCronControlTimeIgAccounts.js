

const { DateTime, Duration } = require('luxon')
const mongoose = require('mongoose')
const _ = require('lodash')

const InstagramAccount = mongoose.model('InstagramAccount')

const tick = async (broker) => {
  const now = DateTime.utc().toJSDate()

  const igAccounts = await InstagramAccount
    .aggregate([{
      $match: {
        activity: 'started',
      },
    }, {
      $project: {
        igAccountId: 1,
        time: 1,
        dateDifference: { $subtract: [now, '$cycle.startedAt'] },
      },
    }, {
      $match: {
        $expr: { $gte: ['$dateDifference', '$time'] },
      },
    }])
    .exec()

  // console.log('DataCronControlTimeIgAccounts --> ')
  // console.log(igAccounts.map(a => a.igAccountId))

  return Promise.all(igAccounts
    .map(a => a.igAccountId)
    .map(igAccountId => broker.call('data.igAccount.stopThereIsNoMoreTime', { igAccountId })))
}

module.exports = {
  tick,
  frequency: Duration.fromObject({ minutes: 1 }).as('milliseconds'),
}

