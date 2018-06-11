

const _ = require('lodash')
const path = require('path')
const fs = require('fs')
const Raven = require('raven')

const { ServiceBroker } = require('moleculer')
const CronPlanner = require('./../CronPlanner')

require('./../common')

const utils = rootRequire('./src/utils')
const config = rootRequire('config')

module.exports = class BrokerBase {
  constructor(name, curentFolderIn) {
    const self = this
    const curentFolder = path.normalize(curentFolderIn)

    if (!fs.statSync(curentFolder).isDirectory()) {
      throw new Error('Invalid path')
    }

    this.logger = console
    this.logLevel = config.isDevelopment() ? 'debug' : 'info'
    this.name = name

    /*
    if (!config.isDevelopment()) {
      this.logger = bindings => pino({
        level: self.logLevel,
      }).child(bindings)
    }
    */

    const configObject = _.defaultsDeep({

      // node id
      nodeID: utils.generateNodeId(this.name),

      // logger
      logger: this.logger,
      logLevel: this.logLevel,
      logFormatter: config.isDevelopment() ? 'simple' : null,

      // circuitBreaker
      circuitBreaker: {
        enabled: false,
        maxFailures: 5,
        halfOpenTime: 10 * 1000,
        failureOnTimeout: true,
        failureOnReject: true,
      },

      // metrics
      metrics: config.broker.metrics,
      statistics: true,
      internalServices: true,

      // hotReload
      // hotReload: config.isDevelopment(),

      // cache
      cacher: 'Memory',

    }, config.broker)

    // debug
    // console.log('configObject ===> ')
    // console.log(configObject)

    // broker
    this.broker = new ServiceBroker(configObject)

    // load all services
    utils.loadServicesFromFolder(this.broker, path.resolve(curentFolder, 'services'))

    // crons
    const cronsPath = path.resolve(curentFolder, 'crons')
    this.cronPlanner = null
    if (fs.existsSync(cronsPath)) {
      this.cronPlanner = new CronPlanner(this.broker, cronsPath)
    }

    // sentry
    Raven.config(config.sentryURI, {
      name: this.name,
      environment: config.global.environment,
      tags: { node: this.broker.nodeID },
      autoBreadcrumbs: false,
    }).install()
  }

  start() {
    this.broker.start()
    if (this.cronPlanner) {
      this.cronPlanner.start()
    }
  }

  repl() {
    this.broker.repl()
  }
}
