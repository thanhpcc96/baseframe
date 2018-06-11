

const { DateTime, Duration } = require('luxon')
const mongoose = require('mongoose')
const _ = require('lodash')

const config = rootRequire('config')

const InstagramAccount = mongoose.model('InstagramAccount')

// frequency
let frequency = null
if (config.isDevelopment()) {
  frequency = Duration.fromObject({ minutes: 5 }).as('milliseconds')
} else {
  frequency = Duration.fromObject({ minutes: 30 }).as('milliseconds')
}

// tick
const tick = async (broker) => {
  const time = DateTime.utc().minus({ minutes: 30 }).toJSDate()

  const igAccounts = await InstagramAccount
    .find({ lastSynchronizedAt: { $lt: time }, activity: 'started' })
    .sort({ lastSynchronizedAt: 1 })
    .limit(50)
    .exec()

  return Promise.all(igAccounts
    .map(i => i.igAccountId)
    .map(igAccountId => broker.call('bot.igAccount.fetch', { igAccountId, time: Date.now() })))
}

module.exports = { tick, frequency }
