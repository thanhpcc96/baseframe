

const express = require('express')
const _ = require('lodash')

/**
 * Main
 */
const router = express.Router()

// accounts
router.get('/users', (req, res, next) => {
  const page = 0
  const numberPerPage = 20

  req.broker.call('data.admin.user.findAll', { page, numberPerPage })
    .then((response) => {
      if (response.code !== 200) return next(response)
      const users = response.data[response.type]
      res.render('data/users', { users })
    }).catch(err => next(err))
})


module.exports = router
