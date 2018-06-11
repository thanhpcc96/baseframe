

const requireDir = require('require-dir')

module.exports = function loadServicesFromFolder(broker, folder) {
  const services = requireDir(folder)

  Object.keys(services)
    .filter(s => s.indexOf('.service') > -1)
    .map(s => services[s])
    .filter(s => s !== {})
    .forEach(s => broker.createService(s))
}

