

const HistoricalBroker = require('./HistoricalBroker')

const cluster = rootRequire('./src/cluster.js')

cluster(() => {
  // new HistoricalBroker().repl();
  new HistoricalBroker().start()
})

