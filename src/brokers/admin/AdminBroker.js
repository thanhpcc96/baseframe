

const BrokerBase = require('./../BrokerBase')

module.exports = class AdminBroker extends BrokerBase {
  constructor() {
    super('admin', __dirname)
  }
}
