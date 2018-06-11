

const requireDir = require('require-dir')
const _ = require('lodash')

const ServiceBase = rootRequire('src/brokers/ServiceBase')
const utils = rootRequire('./src/utils')

const service = {
  name: 'historical',
  actions: require('./actions'),
  created() {
    utils.connectMongoose('mongodb://localhost/ant-historical')
    requireDir('./models')
  },

  started() {
  },

  stopped() {
    utils.disconnectMongoose()
  },
}

module.exports = _.defaultsDeep(service, ServiceBase)

