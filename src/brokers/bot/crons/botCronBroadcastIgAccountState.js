

const { DateTime, Duration } = require('luxon')
const mongoose = require('mongoose')
const _ = require('lodash')

const InstagramAccount = mongoose.model('InstagramAccount')

const tick = async (broker) => {
  const cursor = InstagramAccount.collection.find({}).batchSize(1000)

  while (await cursor.hasNext()) {
    const doc = await cursor.next()

    const payload = {
      igAccount: {
        igAccountId: doc.igAccountId,
      },
      state: doc.state,
    }

    await Promise.all([
      broker.call('data.control.refresh', payload),
      broker.call('statistic.control.refresh', payload),
    ])
  }

  return null
}

module.exports = {
  tick,
  frequency: Duration.fromObject({ minutes: 5 }).as('milliseconds'),
}

