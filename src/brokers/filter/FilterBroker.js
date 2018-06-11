

const BrokerBase = require('./../BrokerBase')

module.exports = class DataBroker extends BrokerBase {
  constructor() {
    super('filter', __dirname)
  }
}
