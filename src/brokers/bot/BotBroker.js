

const BrokerBase = require('./../BrokerBase')

module.exports = class BotBroker extends BrokerBase {
  constructor() {
    super('bot', __dirname)
  }
}
