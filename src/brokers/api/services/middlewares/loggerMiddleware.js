

const _ = require('lodash')
const onFinished = require('on-finished')
const onHeaders = require('on-headers')

const config = rootRequire('config')

/* eslint-disable no-underscore-dangle, no-console */

/**
 * Middleware to connect every request to req.logger
 * inspired on expressjs morgan logger
 */
module.exports = (req, res, next) => {
  // request data
  req._startAt = null
  req._startTime = null
  req._remoteAddress = getip(req)

  // response data
  res._startAt = null
  res._startTime = null

  // record request start
  recordStartTime.call(req)

  function logRequest() {
    const ip = getip(req)
    const method = req.method
    const url = req.originalUrl || req.url
    const status = res.statusCode

    // if we have the expressjs/compression middleware installed, _contentLength
    // does not get set so we need to check our headers
    const size = res.getHeader('Content-Length') || res._contentLength

    // we have to be care here!
    let msTime = 0
    if (_.isArray(res._startAt) && _.isArray(req._startAt)) {
      msTime = (res._startAt[0] - req._startAt[0]) * 1e3 + (res._startAt[1] - req._startAt[1]) * 1e-6
      msTime = msTime.toFixed(3)
    }

    const logLine = `${ip} - ${method} - ${url} - ${status} - ${msTime} - ${size}`

    if (typeof req.logger === 'function') {
      req.logger.info(logLine)
    }

    if (config.isDevelopment()) {
      console.log(logLine)
    }
  }

  // record response start
  onHeaders(res, recordStartTime)

  // log when response finished
  onFinished(res, logRequest)

  next()
}

/**
 * Get request IP address.
 *
 * @private
 * @param {IncomingMessage} req
 * @return {string}
 */

function getip(req) {
  return req.ip || req.headers['x-forwarded-for'] || (req.connection && req.connection.remoteAddress) || undefined
}

/**
 * Record the start time.
 * @private
 */

function recordStartTime() {
  this._startAt = process.hrtime()
  this._startTime = new Date()
}
