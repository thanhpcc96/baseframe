

const _ = require('lodash')
const requireDir = require('require-dir')

const ServiceBase = rootRequire('src/brokers/ServiceBase')
const utils = rootRequire('./src/utils')

// load models before load actions
requireDir('./../models')

// after models loaded
const QueuePlannerWorker = rootRequire('./src/brokers/bot/queue/QueuePlannerWorker')

// main
const service = {
  name: 'bot',
  actions: require('./actions'),
  created() {
    const self = this
    // mongo
    utils.connectMongoose('mongodb://localhost/ant-bot')

    // queues
    this.queuePlannerWorker = new QueuePlannerWorker(this.broker)
    this.startWorkers = async function startWorkers() {
      return self.queuePlannerWorker.start()
    }
    this.stopWorkers = async function startWorkers() {
      return self.queuePlannerWorker.stop()
    }
    this.removeWorkers = async function startWorkers() {
      return self.queuePlannerWorker.remove()
    }
  },

  async started() {
    await this.startWorkers()
  },

  async stopped() {
    await this.removeWorkers()

    // disconnect mongo connection
    utils.disconnectMongoose()
  },

  events: {
    'bot.workers.start': function botStart(payload) {
      return this.startWorkers()
    },
    'bot.workers.stop': function botStop(payload) {
      return this.stopWorkers()
    },
  },
}

module.exports = _.defaultsDeep(service, ServiceBase)
