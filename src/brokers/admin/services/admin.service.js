

const _ = require('lodash')

const ServiceBase = rootRequire('src/brokers/ServiceBase')
const utils = rootRequire('./src/utils')
const server = require('./server.js')

const service = {
  name: 'api',
  version: 1,
  created() {
    // admin web server
    this.server = server(this)

    // mongo
    utils.connectMongoose('mongodb://localhost/ant-admin')
  },

  started() {
    this.httpInstance = this.server.listen()
  },

  stopped() {
    this.httpInstance.close()
  },
}

module.exports = _.defaultsDeep(service, ServiceBase)

