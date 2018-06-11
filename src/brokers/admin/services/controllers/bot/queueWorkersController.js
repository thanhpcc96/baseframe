

const express = require('express')
const _ = require('lodash')

/**
 * Main
 */
const router = express.Router()

// get all workers
router.get('/workers', (req, res, next) => {
  const page = 0
  const numberPerPage = 200

  req.broker.call('bot.admin.queue.worker.findAll', { page, numberPerPage })
    .then((response) => {
      if (response.code !== 200) return next(response)
      const workers = response.data[response.type]
      res.render('bot/workers', { workers })
    }).catch(err => next(err))
})

// start all
router.get('/workers/start-all', (req, res, next) => {
  req.broker.broadcast('bot.workers.start', {})
  res.redirect('/panel/bot/workers')
})

// stop all
router.get('/workers/stop-all', (req, res, next) => {
  req.broker.broadcast('bot.workers.stop', {})
  res.redirect('/panel/bot/workers')
})

module.exports = router
