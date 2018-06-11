

const getAllAction = require('./getAllAction')
const getAction = require('./getAction')
const setAction = require('./setAction')
const loadDefaults = require('./loadDefaults')

module.exports = {
  getAll: getAllAction,
  get: getAction,
  set: setAction,
  loadDefaults,
}
