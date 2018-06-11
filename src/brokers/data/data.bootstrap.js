

const DataBroker = require('./DataBroker')

const cluster = rootRequire('./src/cluster.js')

cluster(() => {
  // new DataBroker().repl();
  new DataBroker().start()
})

