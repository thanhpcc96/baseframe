

const BrokerBase = require('./../BrokerBase')

module.exports = class HistoricalBroker extends BrokerBase {
  constructor() {
    super('historical', __dirname)
  }
}
