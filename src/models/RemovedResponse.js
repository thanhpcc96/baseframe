'use strict';

const Response = require('./Response');

module.exports = class RemovedResponse extends Response {
  constructor(type) {
    super(200, type);
  }
};

