

const ApiBroker = require('./ApiBroker')

const cluster = rootRequire('./src/cluster.js')

cluster(() => {
  new ApiBroker().start()
})
