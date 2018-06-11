'use strict';

const _ = require('lodash');

module.exports = function errorToObject(error = null) {
  if (null === error || undefined === error) {
    return null;
  }

  if (!(error instanceof Error)) {
    return error;
  }

  let object = {};

  //node.js error
  object.code = error.code;
  object.message = error.message;
  object.stack = error.stack;

  //moleculer error
  object.name = error.name;
  object.code = error.code;
  object.type = error.type;
  object.nodeID = error.nodeID;
  object.data = error.data;
  object.ctx = error.ctx;

  return _.pick(object, _.identity);
};

