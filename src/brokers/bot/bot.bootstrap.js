

const BotBroker = require('./BotBroker')

const cluster = rootRequire('./src/cluster.js')

cluster(() => {
  new BotBroker().start()
})
