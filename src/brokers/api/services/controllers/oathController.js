

const _ = require('lodash')

const { check, validationResult } = require('express-validator/check')

const { matchedData, sanitize } = require('express-validator/filter')

const { validationHandlerMiddleware } = require('./../middlewares')

const oauth = require('./../oauth')

/**
 * validation for grant type password
 */
const grantValidation = [
  check('email', 'Invalid email.').exists().isEmail().trim()
    .normalizeEmail(),
  check('password', 'Invalid password.').exists().trim(),
  check('grantType').equals('password').trim(),
]

function grantPost(req, res) {
  const payload = matchedData(req)
  payload.ip = req.ip

  req.broker.call('data.user.find.emailPassword', payload)
    .then(response => (response.code === 200 ? Promise.resolve(response) : Promise.reject(response)))
    .then(response => oauth.grant(response.data[response.type]))
    .then(tokenObject => res.jsonData(201, 'token', tokenObject))
    .catch(err => res.manageResponseObject(err))
}

/**
 *  Validation for refresh token!
 */

const refreshTokenValidation = [
  check('refreshToken', 'Invalid refresh token.').exists().trim(),
]

function refreshTokenPost(req, res, next) {
  const payload = matchedData(req)

  req.broker.call('data.user.find.refreshToken', payload)
    .then(response => (response.code === 200 ? Promise.resolve(response) : Promise.reject(response)))
    .then(response => oauth.grant(response.data[response.type]))
    .then(tokenObject => res.jsonData(201, 'token', tokenObject))
    .catch((response) => {
      if (response && response.code === 404) {
        res.jsonError(403, 'invalid_refresh_token', 'refresh token not valid')
      } else {
        return res.manageResponseObject(response)
      }
    })
    .catch(err => next(err))
}

/**
 * Auto login!
 */

const autologinValidation = [
  check('token').exists().trim(),
]

function autologinPost(req, res) {
  const payload = {
    token: matchedData(req).token,
    ip: req.ip,
  }

  req.broker.call('data.user.find.autologinToken', payload)
    .then(response => (response.code === 200 ? Promise.resolve(response) : Promise.reject(response)))
    .then(response => oauth.grant(response.data[response.type]))
    .then(tokenObject => res.jsonData(201, 'token', tokenObject))
    .catch(err => res.manageResponseObject(err))
}

// exports!
module.exports = function (router) {
  router.post('/oauth/token', grantValidation, validationHandlerMiddleware, grantPost)
  router.post('/oauth/refresh', refreshTokenValidation, validationHandlerMiddleware, refreshTokenPost)
  router.post('/oauth/autotoken', autologinValidation, validationHandlerMiddleware, autologinPost)
}
