'use strict';

const _ = require('lodash');

const { check, validationResult, } = require('express-validator/check');

const { matchedData, sanitize, } = require('express-validator/filter');

const { validationHandlerMiddleware, captchaMiddleware, OauthMiddleware, } = require('./../../middlewares');

/**
 * [middlewares description]
 * @type {[type]}
 */
let middlewares = module.exports = [];

middlewares.push([
  check('igAccountId').exists().isMongoId(),
  check('speed').exists().isInt({
    min: -1,
    max: 1,
  }),
  sanitize('speed').toInt(),
  check('full').optional(),
  sanitize('full').toBoolean(),
]);

middlewares.push(validationHandlerMiddleware);

middlewares.push((req, res) => {
  let payload = {
    igAccountId: matchedData(req).igAccountId,
    speed: matchedData(req).speed,
    full: matchedData(req).full,
    userId: req.userId,
  };

  res.manageServiceResponse(req.broker.call('data.igAccount.speed.update', payload));
});
