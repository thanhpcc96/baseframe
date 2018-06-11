

const BrokerBase = require('./../BrokerBase')

module.exports = class ConfigBroker extends BrokerBase {
  constructor() {
    super('config', __dirname)
  }
}
