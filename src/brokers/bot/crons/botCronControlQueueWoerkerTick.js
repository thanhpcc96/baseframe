

const { DateTime, Duration } = require('luxon')
const mongoose = require('mongoose')
const _ = require('lodash')
const Raven = require('raven')

const InstagramAccount = mongoose.model('InstagramAccount')

const tick = async (broker) => {
  // cursor ticks open for more than 5 minutes
  const cursor = InstagramAccount.collection.find({
    tickLocked: true,
    lockedAt: { $lte: DateTime.utc().minus({ minutes: 5 }).toJSDate() },
  }).batchSize(1000)

  // liberate tick and report
  while (await cursor.hasNext()) {
    const doc = await cursor.next()

    await InstagramAccount.findOneAndUpdate({
      igAccountId: doc.igAccountId,
    }, {
      $set: {
        tickLocked: false,
        unlockedAt: DateTime.utc(),
      },
    }).exec()

    Raven.captureException(new Error(`igAccount tick unlocked, igAccount: ${JSON.stringify(doc)}`))
  }

  return null
}

module.exports = {
  tick,
  frequency: Duration.fromObject({ seconds: 5 }).as('milliseconds'),
}

