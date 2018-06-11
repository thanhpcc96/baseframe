

const requireDir = require('require-dir')
const _ = require('lodash')

const ServiceBase = rootRequire('src/brokers/ServiceBase')
const utils = rootRequire('./src/utils')

const service = {
  name: 'email',
  actions: require('./actions'),
  created() {
  },

  started() {
  },

  stopped() {
  },
}

module.exports = _.defaultsDeep(service, ServiceBase)

