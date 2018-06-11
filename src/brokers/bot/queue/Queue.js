

const _ = require('lodash')

const QueueFactoryManagement = require('./factories/QueueFactoryManagement')
const QueueFactoryCycle = require('./factories/QueueFactoryCycle')
const QueueFactoryControl = require('./factories/QueueFactoryControl')

const QueueStrategyControl = require('./strategies/QueueStrategyControl')
const QueueStrategyCycle = require('./strategies/QueueStrategyCycle')
const QueueStrategyManagement = require('./strategies/QueueStrategyManagement')

const MANAGEMENT = 'management'
const CYCLE = 'cycle'
const CONTROL = 'control'

const QUEUE_TYPES = [{
  name: MANAGEMENT,
  jobTimeout: 5000,
}, {
  name: CYCLE,
  jobTimeout: 15000,
}, {
  name: CONTROL,
  jobTimeout: 3000,
}]

module.exports = class Queue {
  static getQueueTypes() {
    return QUEUE_TYPES
  }

  static async drain(queueName, igAccountId) {
    const QueueStrategy = Queue.getStrategy(queueName)
    return QueueStrategy.drainJobs(igAccountId, queueName)
  }

  static async add(queueName, jobType, igAccountId, runAt) {
    if (!QUEUE_TYPES.map(q => q.name).includes(queueName)) {
      throw new Error(`Queue type not supported, queue name: ${queueName}`)
    }

    if (!_.isString(igAccountId)) {
      throw new Error('Invalid igAccountId')
    }

    const factory = Queue.getFactory(queueName)
    const QueueStrategy = Queue.getStrategy(queueName)

    const job = factory.create(igAccountId, jobType, runAt)

    if (job === null) {
      throw new Error(`This job is no supported on this queue. queue: ${queueName}, job: ${jobType}.`)
    }

    return QueueStrategy.addJob(igAccountId, queueName, job)
  }

  static getFactory(queueName) {
    switch (queueName) {
    case MANAGEMENT:
      return new QueueFactoryManagement()
    case CYCLE:
      return new QueueFactoryCycle()
    case CONTROL:
      return new QueueFactoryControl()
    default:
      throw new Error('Queue not supported')
    }
  }

  static getStrategy(queueName) {
    switch (queueName) {
    case CONTROL:
      return QueueStrategyControl
    case MANAGEMENT:
      return QueueStrategyManagement
    case CYCLE:
      return QueueStrategyCycle
    default:
      throw new Error('Queue not supported')
    }
  }
}

