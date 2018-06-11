'use strict';

const Response = require('./Response');

module.exports = class FoundResponse extends Response {
  constructor(type, data) {
    super(200, type, data);
  }
};

