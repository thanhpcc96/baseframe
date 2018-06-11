

const express = require('express')

const pingController = require('./controllers/pingController')
const homeController = require('./controllers/homeController')
const userController = require('./controllers/userController')
const oathController = require('./controllers/oathController')
const resetPasswordController = require('./controllers/resetPasswordController')
const igAccountController = require('./controllers/igAccountController')
const audienceController = require('./controllers/audienceController')
const searchController = require('./controllers/searchController')
const verifyEmailController = require('./controllers/verifyEmailController')

const router = express.Router()

router.get('/', homeController)
router.get('/ping', pingController)

resetPasswordController(router)
verifyEmailController(router)
oathController(router)
userController(router)
igAccountController(router)
audienceController(router)
searchController(router)

module.exports = router
