

const _ = require('lodash')

module.exports = function filterResponse(data, allowedAttributes) {
  return Object.keys(data)
    .filter(key => allowedAttributes.includes(key))
    .reduce((obj, key) => {
      obj[key] = data[key]
      return obj
    }, {})
}
