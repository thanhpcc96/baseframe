

const express = require('express')
const _ = require('lodash')

const accountsController = require('./accountsController.js')
const usersController = require('./usersController.js')

/**
 * Main
 */
const router = express.Router()

router.use('/data', accountsController)
router.use('/data', usersController)

module.exports = router
