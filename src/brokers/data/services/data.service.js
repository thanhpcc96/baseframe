

const requireDir = require('require-dir')
const _ = require('lodash')

const ServiceBase = rootRequire('src/brokers/ServiceBase')
const utils = rootRequire('./src/utils')
const actions = require('./actions')

const service = {
  name: 'data',
  actions,
  created() {
    utils.connectMongoose('mongodb://localhost/ant-data')
    requireDir('./models')
  },

  started() {
  },

  stopped() {
    utils.disconnectMongoose()
  },
}

module.exports = _.defaultsDeep(service, ServiceBase)

