

const requireDir = require('require-dir')
const _ = require('lodash')

const ServiceBase = rootRequire('src/brokers/ServiceBase')
const utils = rootRequire('./src/utils')
const actions = require('./actions')

const service = {
  name: 'config',
  actions,
  created() {
    utils.connectMongoose('mongodb://localhost/ant-config')
    requireDir('./models')
  },

  started() {
    this.broker.call('config.loadDefaults')
  },

  stopped() {
    utils.disconnectMongoose()
  },
}

module.exports = _.defaultsDeep(service, ServiceBase)

