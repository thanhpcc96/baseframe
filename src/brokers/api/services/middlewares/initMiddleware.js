

const http = require('http')

const _ = require('lodash')
const uuidv1 = require('uuid/v1')

const config = rootRequire('./config.js')

module.exports = moleculerContext => (req, res, next) => {
  // add broker and logger to every request object
  req.logger = moleculerContext.logger
  req.broker = moleculerContext.broker

  // generate id for every request
  const reqId = uuidv1()
  req.id = reqId
  res.header('X-Smartgram-Request-Id', reqId)

  // get real ip
  req.ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress || req.ip || null

  res.manageServiceResponse = promise => promise
    .then(result => res.manageResponseObject(result))
    .catch(error => res.manageResponseObject(error))

  res.manageResponseError = function manageResponseError(error) {
    console.log('error')
    console.log(error.constructor.name)
    console.log(error)
    console.log(typeof error)
    res.json(error)
  }

  res.manageResponseObject = function manageResponseObject(response) {
    if (!Number.isFinite(response.code)) {
      response.code = -1
    }

    if (false && config.isDevelopment()) {
      console.error('manageResponseObject --> ')
      console.error(' --> ')
      console.error(response)
      console.error(' --< ')
    }

    switch (response.code) {
    case 200: // ok / updated
    case 201: // created
    case 204: // no content
    case 209: // successful message to user
      const type = response.type
      const data = response.data ? response.data[type] : null
      return res.jsonData(response.code, type, data, response.message)

    case 400: // bad request
    case 401: // unauthorized, OAuthException -> Error validating access token
    case 403: // only happen when refresh_token fails -> so the client app has to logout the current user
    case 404: // not found
    case 409: // conflict data
    case 410: // challenged_required
    case 500: // internal error
      const title = response.data ? response.data.title : null
      const detail = response.data ? response.data.detail : null
      return res.jsonError(response.code, title, detail)

    default:
      req.logger.error(`response unknown, status: ${response.code}`)
      next(response)
    }
  }

  // positve response to client
  res.jsonData = (status = 200, type = '', data = {}, message = '') => {
    // var data = _.pickBy(data, _.identity)

    setStatusHeader(status)

    const dataObject = {
      status,
      code: http.STATUS_CODES[status],
      data: {
        type,
        attributes: data,
      },
    }

    if (!_.isEmpty(message)) {
      dataObject.message = message
    }

    // dataObject = _.pickBy(dataObject, _.identity)
    // dataObject.data = _.pickBy(dataObject.data, _.identity)

    res.json(dataObject)
  }

  // negative response to client
  res.jsonError = (status = 500, title = '', detail = '', metadata = null) => {
    setStatusHeader(status)

    let errorObject = {
      status,
      code: http.STATUS_CODES[status],
      error: {
        title,
        detail,
      },
      request: req.id,
      ip: req.ip,
    }

    if (metadata) {
      errorObject.error.metadata = metadata
    }

    errorObject = _.pickBy(errorObject, _.identity)
    errorObject.error = _.pickBy(errorObject.error, _.identity)

    res.json(errorObject)
  }

  // negative response to client
  res.jsonErrors = (status = 500, errors) => {
    setStatusHeader(status)

    const errorObject = {
      status,
      code: http.STATUS_CODES[status],
      error: errors,
      request: req.id,
      ip: req.ip,
    }

    res.json(errorObject)
  }

  // helper...
  function setStatusHeader(status = 0) {
    if (!res.headersSent && status > 0) {
      res.status(status)
    }
  }

  next()
}
