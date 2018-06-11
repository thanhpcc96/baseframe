'use strict';

const { validationResult } = require('express-validator/check');

/**
 * Middleware if some error from validation. break middleware chain and call error handler with validation error
 */

module.exports = function (req, res, next) {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    next();
  } else {
    res.jsonErrors(400, errors.array());
  }
};
