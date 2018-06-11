'use strict';

const _ = require('lodash');

const {
  check,
  validationResult,
} = require('express-validator/check');

const {
  matchedData,
  sanitize,
} = require('express-validator/filter');

const {
  validationHandlerMiddleware,
  captchaMiddleware,
  OauthMiddleware,
} = require('./../../middlewares');

/**
 * [middlewares description]
 * @type {[type]}
 */
let middlewares = module.exports = [];

middlewares.push([
  //checks
  check('igAccountId').exists().isMongoId(),
  check('likes').exists().isBoolean(),
  check('comments').exists().isBoolean(),
  check('follows').exists().isBoolean(),
  check('unfollows').exists().isBoolean(),
  check('full').optional().isBoolean(),
  //sanitize to boolean
  sanitize('likes').toBoolean(),
  sanitize('comments').toBoolean(),
  sanitize('follows').toBoolean(),
  sanitize('unfollows').toBoolean(),
  sanitize('full').toBoolean(),
]);

middlewares.push(validationHandlerMiddleware);

middlewares.push((req, res) => {
  let payload = {
    igAccountId: matchedData(req).igAccountId,
    full: matchedData(req).full,
    userId: req.userId,
    likes: matchedData(req).likes,
    comments: matchedData(req).comments,
    follows: matchedData(req).follows,
    unfollows: matchedData(req).unfollows,
  };

  res.manageServiceResponse(req.broker.call('data.igAccount.actions.update', payload));
});
