'use strict';

const request = require('request');

const config = rootRequire('config');

/**
 * check google captcha param
 * @param  {[type]}   req  [description]
 * @param  {[type]}   res  [description]
 * @param  {Function} next [description]
 * @return {[type]}        [description]
 */
module.exports = function (req, res, next) {

  let captchaToken = req.body && req.body.captcha ? req.body.captcha : '';

  let dataBody = {
    secret: config.api.captchaSecret,
    response: captchaToken,
    remoteip: req.ip,
  };

  /**
   * resonpose format
   *{
    "success": true|false,
    "challenge_ts": timestamp,  // timestamp of the challenge load (ISO format yyyy-MM-dd'T'HH:mm:ssZZ)
    "hostname": string,         // the hostname of the site where the reCAPTCHA was solved
    "error-codes": [...]        // optional
    }
   */

  request.post('https://www.google.com/recaptcha/api/siteverify', { form: dataBody }, (err, httpResponse, body) => {
    if (err) {
      return next(err);
    }

    try {
      body = JSON.parse(body);
      if (body && true === body.success) {
        return next();
      }
    } catch (e) {
    }

    //TODO!
    //next(new ConflictDataError('Captcha not valid.'));
  });
};
