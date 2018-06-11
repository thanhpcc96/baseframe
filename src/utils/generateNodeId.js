'use strict';

const uuidv4 = require('uuid/v4');

module.exports = function generateNodeId(seed) {
  return seed + '/' + uuidv4();
};

