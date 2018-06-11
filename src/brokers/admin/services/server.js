

const path = require('path')

const express = require('express')
const { DateTime, Duration } = require('luxon')
const compression = require('compression')
const bodyParser = require('body-parser')
const cors = require('cors')
const _ = require('lodash')
const morgan = require('morgan')
const moment = require('moment')
const mongoose = require('mongoose')

const session = require('express-session')
const MongoStore = require('connect-mongo')(session)

const cookieParser = require('cookie-parser')
const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy

const router = require('./router')

// const errorController = require('./controllers/errorController')
// const { initMiddleware, loggerMiddleware } = require('./middlewares/index')

// moment humanize work around :/
require('./momentDurationHumanize')

const staticUser = { id: '1234567890', name: 'Admin', secret: 'ahsfgabtidnykugf_vebitnyds,hgmxz*+bvknyujacws' }

module.exports = (moleculerContext) => {
  const port = 8000
  const app = express()

  app.disable('x-powered-by')
  app.disable('etag')

  app.use(morgan('combined'))

  app.use(cors())

  app.use(compression())

  // load statics
  app.use(express.static(path.join(__dirname, '/public')))

  app.use(bodyParser.urlencoded({
    extended: true,
  }))

  app.use(cookieParser())

  app.use(bodyParser.json())

  app.use(bodyParser.urlencoded({
    extended: true,
  }))

  app.use(session({
    secret: 'niaursfvb86cgiayrhf9wn7oadkuzxnhrdluawk.dx,.zr,fuacevr<jzcbfgdinyx',
    resave: true,
    saveUninitialized: true,
    store: new MongoStore({ mongooseConnection: mongoose.connection }),
  }))

  app.use(passport.initialize())
  app.use(passport.session())

  // views
  app.set('view engine', 'pug')
  app.set('views', path.join(__dirname, '/views'))

  // local passport strategy
  passport.use(new LocalStrategy(((usernameIn, passwordIn, done) => {
    const username = 'admin'
    const password = 'shipeer#p2p'

    if (username === usernameIn && password === passwordIn) {
      done(null, staticUser)
    } else {
      done(null, false)
    }
  })))

  passport.serializeUser((user, done) => {
    done(null, user.id)
  })

  passport.deserializeUser((user, done) => {
    done(null, staticUser)
  })

  // middleware init
  app.use((req, res, next) => {
    // init locals
    res.locals = res.locals || {}

    // add luxon & moment to all views
    res.locals.DateTime = DateTime
    res.locals.Duration = Duration
    res.locals.moment = moment

    // moleculer link
    req.logger = moleculerContext.logger
    req.broker = moleculerContext.broker

    // notifications
    res.locals.notifications = []
    res.successfulNotification = message => res.locals.notifications.push({ type: 'success', message })
    res.errorNotification = message => res.locals.notifications.push({ type: 'danger', message })
    res.infoNotification = message => res.locals.notifications.push({ type: 'info', message })

    // helper boolean
    req.filterBoolean = (value) => {
      if (_.isBoolean(value)) return value
      if (_.isString(value)) {
        value = value.toLowerCase()
        if (value === 'on') return true
        if (value === 'off') return false
      }
      return null
    }

    // helper time
    req.filterTime = value => parseInt(value, 10)

    // helper format bytes integer
    res.locals.formatBytes = (a, b) => {
      if (a === 0) return '0 Bytes'
      const c = 1024
      const d = b || 2
      const e = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
      const f = Math.floor(Math.log(a) / Math.log(c))
      return `${parseFloat((a / Math.pow(c, f)).toFixed(d))} ${e[f]}`
    }

    // next one!
    next()
  })

  app.use(router)

  // override listen
  app._listen = app.listen
  app.listen = () => app._listen(port, () => {
    moleculerContext.logger.debug(`Express listening on port ${port}!`)
  })

  return app
}

