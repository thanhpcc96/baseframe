

const _ = require('lodash')

const ServiceBase = rootRequire('src/brokers/ServiceBase')

const service = {
  name: 'api',
  version: 1,
  actions: {
  },
  created() {
    this.server = require('./server.js')(this)
  },

  started() {
    this.httpInstance = this.server.listen()
  },

  stopped() {
    this.httpInstance.close()
  },
}

module.exports = _.defaultsDeep(service, ServiceBase)
