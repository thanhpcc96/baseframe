'use strict';

const {
  check,
  validationResult,
} = require('express-validator/check');

const { matchedData, sanitize } = require('express-validator/filter');

const {
  validationHandlerMiddleware,
} = require('./../middlewares');

module.exports = function (router) {

  //TODO all
  router.post('/reset-password',
    check('email', 'Invalid email.').exists().isEmail().trim().normalizeEmail(),
    validationHandlerMiddleware,
    (req, res, next) => {
      res.jsonData(200, 'ok', {
        timestamp: Date.now(),
      });
    });
};

