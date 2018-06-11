

const _ = require('lodash')
const { DateTime } = require('luxon')

module.exports = class QueueFactoryBase {
  constructor() {
    this.types = new Map()
  }

  create(igAccountId, type, runAtIn = null, payload = null) {
    if (!(this.types instanceof Map) || this.types.length === 0) {
      throw new TypeError('Inherits classes have to set types as a map of values')
    }

    // optional runAt. runAt in [null, 'string:iso8601:', jsDate, epoch time]
    let runAt = null

    if (runAtIn === null) {
      runAt = DateTime.utc().toJSDate()
    } else if (_.isString(runAtIn)) {
      runAt = DateTime.fromISO(runAtIn, { zone: 'utc' }).toJSDate()
    } else if (_.isDate(runAtIn)) {
      runAt = runAtIn
    } else if (_.isNumber(runAtIn)) {
      runAt = DateTime.fromMillis(runAtIn).toJSDate()
    }

    if (!_.isDate(runAt) || Number.isNaN(runAt.getTime())) {
      throw new TypeError('runAt has to be a javascript date')
    }

    // not job found -> Queue class throw a error if not job found
    const dataJob = this.types.get(type)
    if (undefined === dataJob) {
      throw new TypeError(`job not found, type: ${type}, igAccountId: ${igAccountId}`)
    }

    // job found but bad format on types attribute
    const command = dataJob.commandToRun
    if (_.isEmpty(command)) {
      throw new TypeError('Bad format on types attribute')
    }

    return {
      command,
      status: 'enqueue',
      runAt,
      payload,
    }
  }
}

