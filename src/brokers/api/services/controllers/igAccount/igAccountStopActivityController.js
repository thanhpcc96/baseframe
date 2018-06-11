'use strict';

const {
  check,
} = require('express-validator/check');

const {
  matchedData,
  sanitize,
} = require('express-validator/filter');

const {
  validationHandlerMiddleware,
} = require('./../../middlewares');

/**
 * [middlewares description]
 * @type {[type]}
 */
let middlewares = module.exports = [];

middlewares.push([
  check('igAccountId').exists().isMongoId(),
  check('full').optional().isBoolean(),
  sanitize('full').toBoolean(),
]);

middlewares.push(validationHandlerMiddleware);

middlewares.push((req, res) => {
  let payload = {
    igAccountId: matchedData(req).igAccountId,
    full: matchedData(req).full,
    userId: req.userId,
  };

  res.manageServiceResponse(req.broker.call('data.igAccount.activity.stop', payload));
});
