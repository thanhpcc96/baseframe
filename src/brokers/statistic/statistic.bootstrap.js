

const StatisticBroker = require('./StatisticBroker.js')

const cluster = rootRequire('./src/cluster.js')

cluster(() => {
  // new StatisticBroker().repl();
  new StatisticBroker().start()
})

