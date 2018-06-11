

const mongoose = require('mongoose')
const _ = require('lodash')

const { OkResponse, NotFoundResponse } = rootRequire('./src/models')

/**
 * Register a new user
 */

module.exports = {
  params: {
    name: 'string',
    value: 'any',
  },
  async handler(ctx) {
    const Setting = mongoose.model('Setting')
    const { name, value } = ctx.params

    if (_.isEmpty(name)) throw new Error('name is empty')
    if (_.isEmpty(value) && !_.isBoolean(value) && !_.isNumber(value)) throw new Error('value is empty')

    const setting = await Setting.findOne({ name })

    if (_.isEmpty(setting)) return new NotFoundResponse()

    setting.value = parseValue(value)

    await setting.save()

    return new OkResponse()
  },
}

/**
 * [parseValue description]
 * @param  {[type]} value [description]
 * @return {[type]}       [description]
 */
function parseValue(value) {
  if (_.isString(value)) {
    value = value.toLowerCase()

    if (['on', 'true', 'ok', 'yes', 'si', 'active'].indexOf(value) >= 0) {
      value = true
    }

    if (['off', 'false', 'no', 'inactive'].indexOf(value) >= 0) {
      value = false
    }
  }

  return value
}

