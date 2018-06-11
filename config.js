

/** ****************************************************************************
 * Includes
 */

const moment = require('moment')
const _ = require('lodash')

// let NatsTransporter = require('moleculer').Transporters.NATS;
// let RedisTransporter = require('moleculer').Transporters.Redis;
const AmqpTransporter = require('moleculer').Transporters.AMQP

/** ****************************************************************************
 * Utils
 */

/** ****************************************************************************
 * Main
 */

const config = module.exports = {}

// used above all app
config.global = {}
config.global.environment = process.env.NODE_ENV || 'development'

// helpers!
config.isDevelopment = () => config.global.environment === 'development'

config.isProduction = () => config.global.environment === 'production'

// general
config.sentryURI = 'https://pass:user@sentry.io/port'

// broker
config.broker = {}

config.broker.transporter = new AmqpTransporter(process.env.CLOUDAMQP_URL || process.env.AMQP_URL || process.env.AMQP_URI || process.env.CLOUDAMQP_URL || 'amqp://guest:guest@localhost:5672')
// config.broker.transporter = new RedisTransporter();
// config.broker.transporter = new NatsTransporter();

config.broker.logger = console
config.broker.logLevel = 'debug'
// config.broker.metrics = !!config.isProduction()

// config.broker.requestTimeout = 1000;

// last testing
// config.broker.requestRetry = 1
// config.broker.hotReload = false
config.broker.heartbeatInterval = config.isDevelopment() ? 100 : 10
config.broker.heartbeatTimeout = config.isDevelopment() ? 150 : 15

// api mircoservice
config.api = {}
config.api.internalPort = Number(process.env.PORT || 9000)
config.api.externalPort = Number(process.env.APP_PORT || 9000)
config.api.secretKey = 'ausyd_tbg8a**JYUTYd-insdADS7fyasd*uilvsrzDBFS-ZRXS_reqxa>S<R*GTHN75RT_<JYimbh>gevc>fvgwbe+nE6G5SFRCXWEASR<ZCFQ3W'
config.api.accessTokenTtl = moment.duration(60, 'seconds').asSeconds()
config.api.captchaSecret = '6Ldd7zgK5DkfFj4DFRVB7Fsdasd_W_4i-fsoXX'

// data microservice
config.data = {}
config.data.enabledAccountDefault = false

