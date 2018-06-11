

const express = require('express')
const _ = require('lodash')

/**
 * Main
 */
const router = express.Router()

// accounts
router.get('/accounts', (req, res, next) => {
  const page = 0
  const numberPerPage = 20

  req.broker.call('bot.admin.igAccount.findAll', { page, numberPerPage })
    .then((response) => {
      if (response.code !== 200) return next(response)
      const igAccounts = response.data[response.type]

      console.log('------------>')
      console.log(igAccounts)
      console.log('------------>')


      res.render('bot/accounts', { igAccounts })
    }).catch(err => next(err))
})


module.exports = router
