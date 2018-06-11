

const express = require('express')
const _ = require('lodash')
const unflatten = require('flat').unflatten

/**
 * Main
 */
const router = express.Router()

// configuration
router.get('/configuration', (req, res, next) => {
  req.broker.call('config.getAll')
    .then((response) => {
      if (response.code !== 200) return next(response)
      const settings = unflatten(_.fromPairs(response.data.settings.map(s => [s.name, s.value])))
      res.render('configuration', { settings })
    }).catch(err => next(err))
})

// configuration cycle
router.get('/configuration/cycle', (req, res) => res.redirect(302, '/configuration'))
router.post('/configuration/cycle', async (req, res, next) => {
  const stopValue = req.filterBoolean(req.body['allow.cycle.stop'])
  const startValue = req.filterBoolean(req.body['allow.cycle.start'])

  const response = await Promise.all([
    req.broker.call('config.set', { name: 'allow.cycle.start', value: startValue }),
    req.broker.call('config.set', { name: 'allow.cycle.stop', value: stopValue }),
  ])

  if (response.code === 200) {
    res.successfulNotification('ok!')
  } else {
    res.errorNotification('problems :/')
  }

  res.redirect(302, '/panel/configuration')
})

// configuration defaults
router.get('/configuration/defaults', (req, res) => res.redirect(302, '/configuration'))
router.post('/configuration/defaults', async (req, res, next) => {
  const activatedValue = req.filterBoolean(req.body['account.default.actived'])
  const timeValue = req.filterTime(req.body['account.default.time'])

  const response = await Promise.all([
    req.broker.call('config.set', { name: 'account.default.actived', value: activatedValue }),
    req.broker.call('config.set', { name: 'account.default.time', value: timeValue }),
  ])

  if (response.code === 200) {
    res.successfulNotification('ok!')
  } else {
    res.errorNotification('problems :/')
  }

  res.redirect(302, '/panel/configuration')
})


module.exports = router
