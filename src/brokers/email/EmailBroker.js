

const BrokerBase = require('./../BrokerBase')

module.exports = class EmailBroker extends BrokerBase {
  constructor() {
    super('email', __dirname)
  }
}
