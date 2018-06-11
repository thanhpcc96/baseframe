

const _ = require('lodash')

const ServiceBase = rootRequire('src/brokers/ServiceBase')

const service = {
  name: 'ig',
  actions: require('./actions'),
  created() {
  },

  started() {
  },

  stopped() {

  },
}

module.exports = _.defaultsDeep(service, ServiceBase)

