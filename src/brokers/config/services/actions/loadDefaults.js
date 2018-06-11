

const mongoose = require('mongoose')
const _ = require('lodash')
const path = require('path')
const flatten = require('flat')

const { OkResponse, NotFoundResponse } = rootRequire('./src/models')

/**
 * Register a new user
 */

module.exports = {
  params: {
  },
  async handler(ctx) {
    const pathConfig = path.join(__dirname, '..', 'config.json')

    ctx.broker.logger.debug(`Loading default config, path: ${pathConfig}`)

    const configuration = require(pathConfig)

    if (_.isEmpty(configuration)) throw new Error('configuration is empty, not found maybe?')

    _.forIn(flatten(configuration), async (value, key) => addConfigurationEntry(ctx, key, value))

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

/**
 * [addConfigurationEntry description]
 * @param {[type]} key   [description]
 * @param {[type]} value [description]
 */
async function addConfigurationEntry(ctx, name, value) {
  const Setting = mongoose.model('Setting')
  let entry = await Setting.findOne({ name })

  if (_.isEmpty(entry)) {
    ctx.broker.logger.debug(`adding config entry, name: ${name}, value: ${value}`)
    entry = new Setting({ name, value: parseValue(value) })
    await entry.save()
  }

  await removeDuplicates(entry)

  return entry
}

/**
 * [removeDuplicates description]
 * @param  {[type]} id   [description]
 * @param  {[type]} name [description]
 * @return {[type]}      [description]
 */
function removeDuplicates(setting) {
  const Settings = mongoose.model('Setting')
  return Settings.remove({ _id: { $ne: setting._id }, name: setting.name })
}
