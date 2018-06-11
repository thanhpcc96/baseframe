

const ListBroker = require('./ListBroker')

const cluster = rootRequire('./src/cluster.js')

cluster(() => {
  // new DataBroker().repl();
  new ListBroker().start()
})

