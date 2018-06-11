

const _ = require('lodash')

module.exports = function pickByDeepLodash(input, props) {
  function pickByDeepOnOwnProps(obj) {
    if (!_.isArray(obj) && !_.isObject(obj)) {
      return obj
    }

    if (_.isArray(obj)) {
      return pickByDeepLodash(obj, props)
    }

    const o = {}
    _.forOwn(obj, (value, key) => {
      o[key] = pickByDeepLodash(value, props)
    })

    return _.pickBy(o, props)
  }

  if (arguments.length > 2) {
    props = Array.prototype.slice.call(arguments).slice(1)
  }

  if (typeof input === 'undefined') {
    return {}
  }

  if (_.isArray(input)) {
    return input.map(pickByDeepOnOwnProps)
  }

  return pickByDeepOnOwnProps(input)
}
