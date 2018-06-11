

const EmailBroker = require('./EmailBroker')

const cluster = rootRequire('./src/cluster.js')

cluster(() => {
  // new EmailBroker().repl()
  new EmailBroker().start()
})

