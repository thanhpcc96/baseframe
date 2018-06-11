

const BrokerBase = require('./../BrokerBase')

module.exports = class DataBroker extends BrokerBase {
  constructor() {
    super('list', __dirname)
  }
}
