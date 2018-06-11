

const { DateTime, Duration } = require('luxon')
const mongoose = require('mongoose')
const _ = require('lodash')

const config = rootRequire('config')

// frequency
let frequency = null
if (config.isDevelopment()) {
  frequency = Duration.fromObject({ minutes: 5 }).as('milliseconds')
} else {
  frequency = Duration.fromObject({ minutes: 30 }).as('milliseconds')
}

// tick
const tick = async (broker) => {
  const IgAccountControlModel = mongoose.model('IgAccountControl')

  const lastTakenAt = DateTime.utc().minus({ hours: 12 }).toJSDate()

  // get cursor
  const cursor = await IgAccountControlModel.collection.find({
    $or: [{
      lastTakenAt: null,
    }, {
      lastTakenAt: { $lte: lastTakenAt },
    }],
    activity: 'started',
  })
    .batchSize(1000)

  // iterate and make updates
  while (await cursor.hasNext()) {
    const doc = await cursor.next()

    const updateResult = await broker.call('statistic.data.update', { igAccount: { igAccountId: doc.igAccountId } })
    if (updateResult.code !== 200) throw updateResult

    await IgAccountControlModel.findOneAndUpdate({ igAccountId: doc.igAccountId }, {
      $set: {
        lastTakenAt: DateTime.utc().toJSDate(),
      },
    })
  }
}

module.exports = { tick, frequency }
