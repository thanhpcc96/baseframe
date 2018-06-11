

const express = require('express')
const _ = require('lodash')

/**
 * Main
 */
const router = express.Router()

// accounts
router.get('/info', (req, res) => {
  res.redirect('/panel/info/performance')
})

// info nodes
router.get('/info/nodes', async (req, res) => {
  res.render('info/nodes/index')
})

router.get('/info/nodes/data', async (req, res) => {
  const nodes = await getNodesInfo(req)
  res.render('info/nodes/data', { nodes })
})

// info performance
router.get('/info/performance', async (req, res) => {
  res.render('info/performance/index')
})

router.get('/info/performance/data', async (req, res) => {
  const nodes = await getNodesInfo(req, { actions: false, health: true, stats: true })
  res.render('info/performance/data', { nodes })
})

// info actions
router.get('/info/actions', async (req, res) => {
  const nodes = await getNodesInfo(req, { actions: true, health: false, stats: false })
  res.render('info/actions/index', { nodes })
})

module.exports = router

// helpers
async function getNodesInfo(req, options = { actions: true, health: true, stats: true }) {
  const nodesRaw = req.broker.registry.getNodeList(true)

  const stats = options.stats ? await getStats(req, nodesRaw.filter(n => n.available)) : []
  const healths = options.health ? await getHealth(req, nodesRaw.filter(n => n.available)) : []
  const actions = options.actions ? await getActions(req, nodesRaw.filter(n => n.available)) : []

  return nodesRaw.map((node) => {
    const infoNode = {
      id: node.id,
      type: node.id.substring(0, node.id.indexOf('/')),
      ip: node.ipList ? node.ipList.join(', ') : '?',
      clientVersion: node.client.version,
      clientType: node.client.type,
      available: node.available,
      cpu: _.isNumber(node.cpu) ? `${node.cpu}%` : '?',
      lastHeartbeatTime: node.lastHeartbeatTime,
      statistics: _.find(stats, s => s.nodeID === node.id),
      health: _.find(healths, h => h.nodeID === node.id),
      actions: _.find(actions, a => a.nodeID === node.id),
    }

    return infoNode
  })
    .sort((a, b) => {
      const nameA = a.type.toUpperCase()
      const nameB = b.type.toUpperCase()
      if (nameA < nameB) {
        return -1
      }
      if (nameA > nameB) {
        return 1
      }
      return 0
    })
}

async function getStats(req, nodesRaw) {
  return Promise.all(nodesRaw.map(async (node) => {
    let stats = {}
    try {
      stats = await req.broker.call('$node.stats', {}, { nodeID: node.id })
    } catch (err) {}
    stats.nodeID = node.id
    return stats
  }))
}

async function getHealth(req, nodesRaw) {
  return Promise.all(nodesRaw.map(async (node) => {
    let health = {}
    try {
      health = await req.broker.call('$node.health', {}, { nodeID: node.id })
    } catch (err) {}
    health.nodeID = node.id
    return health
  }))
}

async function getActions(req, nodesRaw) {
  return Promise.all(nodesRaw.map(async (node) => {
    let actions = {}
    try {
      actions = await req.broker.call('$node.actions', { onlyLocal: true }, { nodeID: node.id })
    } catch (err) {}
    actions.nodeID = node.id
    return actions
  }))
}
