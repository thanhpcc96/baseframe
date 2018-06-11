

const { DateTime } = require('luxon')
const uuidv4 = require('uuid/v4')
const stringify = require('json-stringify-safe')
const mongoose = require('mongoose')
const _ = require('lodash')
const Raven = require('raven')

const utils = rootRequire('./src/utils')
const config = rootRequire('config')

const WorkerRegister = require('./WorkerRegister')

const InstagramAccount = mongoose.model('InstagramAccount')

module.exports = class QueueWorker {
  constructor(broker, queueName, jobTimeoutIn = null, timeBetweenTicks = 2000) {
    if (broker.constructor.name !== 'ServiceBroker') {
      throw new Error('DI error -> SimpleExecutor -> expected moleculer broker')
    }

    this.broker = broker
    this.id = uuidv4()

    this.queueName = queueName
    this.jobTimeout = jobTimeoutIn || 7000
    this.running = false
    this.intervalId = null
    this.timeBetweenTicks = timeBetweenTicks // milliseconds
    this.attempsToDoJob = config.isDevelopment() ? 0 : 3

    WorkerRegister.add(this)
  }

  async start() {
    if (this.running) return null
    this.running = true
    this.broker.logger.debug(`starting worker on queue: ${this.queueName}, id: ${this.id}`)
    this.intervalId = setTimeout(() => this.doTick(), this.timeBetweenTicks)
    return WorkerRegister.updateStatus(this, 'startted')
  }

  async stop() {
    if (!this.running) return null
    this.running = false
    this.broker.logger.debug(`stopping worker with id: ${this.id}`)
    if (this.intervalId) {
      clearInterval(this.intervalId)
    }
    return WorkerRegister.updateStatus(this, 'stopped')
  }

  async remove() {
    await this.stop()
    return WorkerRegister.remove(this)
  }

  async doTick() {
    const self = this

    const igAccount = await self.getNextIgAccountJobAndLock()
    const job = await self.getNextJob(igAccount)

    if (igAccount && job) {
      let iteration = 0
      let error = null

      do {
        iteration += 1

        try {
          await self.proccesJob(igAccount, job)
          error = null
        } catch (errorIn) {
          error = errorIn
        }
      } while (error && iteration < this.attempsToDoJob)

      if (error) {
        await self.handleErrorOnTick(igAccount, job, error)
      }

      await self.unlockIgAccount(igAccount)
    }

    await WorkerRegister.workerBeat(this)

    if (self.running) {
      self.intervalId = setTimeout(() => self.doTick(), self.timeBetweenTicks)
    }
  }

  async handleErrorOnTick(igAccount, job, errorIn) {
    const self = this

    // notify other services
    await this.broker.call('data.control.stopped', { igAccount })
    await this.broker.call('statistic.control.stopped', { igAccount })

    // we have to copy the attributes we are interested in
    // the original error has moleculer data so it's too big to deal with mongo
    const error = {
      code: errorIn.code,
      message: errorIn.message,
      stack: errorIn.stack,
    }

    // worker info
    error.command = job.command
    error.igAccountId = igAccount.igAccountId
    error.payload = job ? job.payload : null
    error.workerId = self.id

    self.broker.logger.error('QueueWorker - doTick', error)

    await self.updateErrorJob(igAccount, job, error)
    await self.notifyDataError(igAccount, error)

    // sentry
    Raven.captureException(errorIn)
  }

  async getNextJob(igAccount = null) {
    if (_.isEmpty(igAccount)) return null

    igAccount = igAccount.toJSON ? igAccount.toJSON() : igAccount

    // get next job to do
    return igAccount.queues[this.queueName]
      .filter(j => j.status === 'enqueue')
      .sort((a, b) => new Date(a.runAt) - new Date(b.runAt))
      .slice(-1)
      .pop()
  }

  async proccesJob(igAccount = null, job = null) {
    const self = this
    const timeout = self.jobTimeout

    // no igAccount found
    if (_.isEmpty(igAccount)) return null

    // no modify original and remove mongoose helpers and metadata
    igAccount = igAccount.toJSON ? igAccount.toJSON() : _.cloneDeep(igAccount)

    const igAccountId = igAccount.igAccountId

    if (_.isEmpty(job)) {
      self.broker.logger.error(`there is not job ready to run. Why? ¬¬ igAccountId: ${igAccountId}`)
      return null
    }

    // step 1 - get igAccount
    const responseGetIgAccount = await self.broker.call('bot.igAccount.findOne.igAccountId', { igAccountId }, { timeout })
    if (responseGetIgAccount.code !== 200) throw new Error(responseGetIgAccount)

    // step 2 -> call command
    const payload = job.payload || {}
    payload.igAccount = responseGetIgAccount.data.igAccount
    const resnposeCommand = await self.broker.call(job.command, payload)
    if (resnposeCommand.code !== 200) throw new Error(responseGetIgAccount)

    // step 3 -> update job as complete!
    const conditions = { igAccountId }
    conditions[`queues.${self.queueName}._id`] = job._id

    const update = {
      $set: {},
    }
    update.$set[`queues.${self.queueName}.$.status`] = 'completed'
    update.$set[`queues.${self.queueName}.$.finishedAt`] = DateTime.utc().toJSDate()

    await InstagramAccount.findOneAndUpdate(conditions, update).exec()

    return null
  }

  async unlockIgAccount(igAccount = null) {
    if (_.isEmpty(igAccount)) {
      this.broker.logger.error('call unlockIgAccount() without igAccount')
      return null
    }

    return InstagramAccount.findOneAndUpdate({ igAccountId: igAccount.igAccountId }, {
      $set: {
        tickLocked: false,
        unlockedAt: DateTime.utc(),
      },
    }).exec()
  }

  async getNextIgAccountJobAndLock() {
    const conditions = {
      tickLocked: false,
      error: null,
    }

    conditions[`queues.${this.queueName}`] = {
      $elemMatch: {
        status: 'enqueue',
        runAt: {
          $lte: DateTime.utc(),
        },
      },
    }

    const update = {
      $set: {
        tickLocked: true,
        lockedAt: DateTime.utc(),
      },
    }

    const options = {
      new: true,
    }

    return InstagramAccount.findOneAndUpdate(conditions, update, options)
  }

  async updateErrorJob(igAccount, job, error) {
    const conditions = {
      igAccountId: igAccount.igAccountId,
    }
    conditions[`queues.${this.queueName}._id`] = job._id

    const update = {
      $set: {
        error: JSON.parse(stringify(error)),
        state: 'stopped',
      },
    }
    update.$set[`queues.${this.queueName}.$.status`] = 'failed'
    update.$set[`queues.${this.queueName}.$.failedAt`] = DateTime.utc().toJSDate()

    return InstagramAccount.findOneAndUpdate(conditions, update).exec()
  }

  async notifyDataError(igAccount, error) {
    return this.broker.call('data.igAccount.notification.create', {
      igAccountId: igAccount.igAccountId,
      type: 'internalError',
      error,
    })
  }
}

