

const requireDir = require('require-dir')
const _ = require('lodash')

const ServiceBase = rootRequire('src/brokers/ServiceBase')
const utils = rootRequire('./src/utils')
const actions = require('./actions')

const service = {
  name: 'statistic',
  actions,
  created() {
    utils.connectMongoose('mongodb://localhost/ant-statistic')
    requireDir('./models')
  },

  started() {
  },

  stopped() {
    utils.disconnectMongoose()
  },
}

module.exports = _.defaultsDeep(service, ServiceBase)

