

const BrokerBase = require('./../BrokerBase')

module.exports = class DataBroker extends BrokerBase {
  constructor() {
    super('statistic', __dirname)
  }
}
