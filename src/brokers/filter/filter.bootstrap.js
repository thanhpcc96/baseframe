

const FilterBroker = require('./FilterBroker')

const cluster = rootRequire('./src/cluster.js')

cluster(() => {
  // new FilterBroker().repl();
  new FilterBroker().start()
})

