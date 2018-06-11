'use strict';

const BrokerBase = require('./../BrokerBase');

module.exports = class IgBroker extends BrokerBase{
  constructor() {
    super('ig', __dirname);
  }
};
