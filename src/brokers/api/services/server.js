

const express = require('express')
const compression = require('compression')
const bodyParser = require('body-parser')
const cors = require('cors')
const bearerToken = require('express-bearer-token')
const _ = require('lodash')

const router = require('./router')

const errorController = require('./controllers/errorController')

const { initMiddleware, loggerMiddleware } = require('./middlewares/index')

module.exports = function server(moleculerContext) {
  const port = 9000
  const app = express()

  app.disable('x-powered-by')
  app.disable('etag')
  app.set('trust proxy', true)

  app.use(cors())

  app.use(loggerMiddleware)

  app.use(compression())

  app.use(bodyParser.urlencoded({
    extended: true,
  }))

  app.use(bodyParser.json())

  app.use(bearerToken())

  app.use(initMiddleware(moleculerContext))

  app.use('/api/v1', router)

  app.use(errorController.notFoundHandler)
  app.use(errorController.errorHandler)

  // override listen
  app._listen = app.listen
  app.listen = () => app._listen(port, () => {
    moleculerContext.logger.debug(`Express listening on port ${port}!`)
  })

  return app
}
