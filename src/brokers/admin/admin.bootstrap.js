

const AdminBroker = require('./AdminBroker')

const cluster = rootRequire('./src/cluster.js')

cluster(() => {
  // new AdminBroker().repl()
  new AdminBroker().start()
})
