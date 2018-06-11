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
  //checks
  check('igAccountId').exists().isMongoId(),
  check('audience').exists().isMongoId(),
  check('full').optional(),
  //sanitizes
  sanitize('full').toBoolean(),
]);

middlewares.push(validationHandlerMiddleware);

middlewares.push((req, res) => {
  let payload = {
    igAccountId: matchedData(req).igAccountId,
    full: matchedData(req).full,
    userId: req.userId,
    audience: matchedData(req).audience,
  };

  res.manageServiceResponse(req.broker.call('data.igAccount.audience.update', payload));
});
