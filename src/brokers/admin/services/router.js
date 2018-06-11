

const express = require('express')
const _ = require('lodash')

const configurationRouter = require('./controllers/configurationController')
const infoController = require('./controllers/infoController')
const authenticationController = require('./controllers/authenticationController')
const dataRouter = require('./controllers/data')
const botRouter = require('./controllers/bot')


const config = rootRequire('./config.js')

/**
 * Main
 */
const router = express.Router()

// home -> login
router.get('/', (req, res) => res.redirect(302, '/login'))

// login (no authenticated)
//router.use(authenticationController)

// firewall
router.use('/panel', (req, res, next) => {
  if (config.isDevelopment()) {
    return next()
  }

  if (req.user) {
    next()
  } else {
    res.redirect('/login')
  }
})

// panel routes
router.get('/panel', (req, res) => res.render('panel'))
router.use('/panel', infoController)
router.use('/panel', configurationRouter)
router.use('/panel', dataRouter)
router.use('/panel', botRouter)

module.exports = router

