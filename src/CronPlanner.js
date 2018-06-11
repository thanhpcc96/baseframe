

const path = require('path')
const fs = require('fs')
const _ = require('lodash')
const requireDir = require('require-dir')

/**
 * CronPlanner
 * see http://wiki.c2.com/?ScheduledTask
 */

module.exports = class CronPlanner {
  constructor(broker = null, cronsPathIn) {
    if (broker === null || broker.constructor.name !== 'ServiceBroker') {
      throw new Error(`CronPlanner needs a moleculer broker, given: ${broker}`)
    }

    this.cronsPath = path.normalize(cronsPathIn)

    if (!fs.existsSync(this.cronsPath)) {
      throw new Error('Invalid path')
    }

    this.broker = broker
    this.tasks = []

    // loading crons
    this.broker.logger.debug('Loading crons', { broker: this.broker.nodeID })

    const crons = requireDir(this.cronsPath)
    Object.keys(crons)
      .filter(c => c.toLowerCase().indexOf('cron') > -1)
      .map((c) => {
        if (!_.isFunction(crons[c].tick) || !_.isNumber(crons[c].frequency)) {
          throw new Error(`Cron not valid. tick is not a function or frecuency is not a number, cron: ${c}`)
        }
        this.broker.logger.debug('Loading cron', { cron: c, frequency: crons[c].frequency })
        return c
      })
      .map(c => crons[c])
      .forEach((c) => {
        this.tasks.push({
          tick: c.tick,
          interval: c.frequency,
          timer: null,
        })
      })
  }

  start() {
    const self = this
    this.stop()

    async function wrapTask(task) {
      await task.tick(self.broker)
      // TODO => log when cron fails

      task.timer = setTimeout(() => wrapTask(task), task.interval)
    }

    this.tasks.forEach(t => setTimeout(() => wrapTask(t), t.interval))
  }

  stop() {
    this.tasks.forEach(t => clearTimeout(t.timer))
  }
}

