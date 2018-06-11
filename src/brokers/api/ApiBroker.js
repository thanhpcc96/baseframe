

const BrokerBase = require('./../BrokerBase')

module.exports = class ApiBroker extends BrokerBase {
  constructor() {
    super('api', __dirname)
  }
}
