

const http = require('http')
const _ = require('lodash')

const config = rootRequire('./config.js')


/**
 * action not found controller
 */
module.exports.notFoundHandler = function notFoundHandler(req, res) {
  res.status(404).jsonError(404, {
    status: 404,
    title: http.STATUS_CODES[404],
  })
}

/**
 * error controller
 */
module.exports.errorHandler = function errorHandler(err, req, res, next) {
  // development debug
  if (config.isDevelopment()) {
    console.error('-->')
    console.error('--> error showed on development only')
    console.error(err)
    console.error('<--')
  }

  const title = http.STATUS_CODES[500]
  const detail = http.STATUS_CODES[500]
  const metadata = config.isDevelopment() ? err.stack : null

  if (_.isFunction(res.jsonError)) {
    res.jsonError(500, title, detail, metadata)
  } else {
    if (config.isDevelopment() && err instanceof Error) {
      err.stack = null
    }
    res.status(500).send(err).end()
  }
}
