

const requireDir = require('require-dir')

require('./../../common')

const { ServiceBroker } = require('moleculer')

const utils = rootRequire('./src/utils')

const RedisTransporter = require('moleculer').Transporters.Redis
// let AmqpTransporter = require('moleculer').Transporters.AMQP;

const broker = new ServiceBroker({
  transporter: new RedisTransporter(),
  logger: console,
  nodeID: utils.generateNodeId('repl'),
  logLevel: 'debug',
  requestTimeout: 5 * 1000,
  requestRetry: 1,
  hotReload: false,
  heartbeatInterval: 10,
  heartbeatTimeout: 15,
})

// start
broker.repl()
