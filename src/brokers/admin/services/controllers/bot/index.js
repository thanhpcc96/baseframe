

const express = require('express')
const _ = require('lodash')

const accountsController = require('./accountsController.js')
const queueWorkersController = require('./queueWorkersController.js')

/**
 * Main
 */
const router = express.Router()

router.use('/bot', accountsController)
router.use('/bot', queueWorkersController)

module.exports = router
