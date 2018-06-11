
const _ = require('lodash')
const requireDir = require('require-dir')

module.exports = _.pickBy(requireDir('./'), (value, key) => !key.includes('index'))

