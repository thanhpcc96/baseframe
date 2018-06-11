

const express = require('express')
const _ = require('lodash')
const passport = require('passport')

/**
 * Main
 */
const router = express.Router()

// login
router.get('/login', (req, res, next) => {
  if (req.user) {
    res.redirect('/panel')
  } else {
    res.render('login')
  }
})

router.post('/login', passport.authenticate('local', { failureRedirect: '/login' }), (req, res) => res.redirect('/panel'))

// logout
router.get('/logout', (req, res, next) => {
  req.logout()
  res.redirect('/')
})

module.exports = router
