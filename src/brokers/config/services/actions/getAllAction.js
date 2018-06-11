

const mongoose = require('mongoose')
const _ = require('lodash')

const { FoundResponse, NotFoundResponse } = rootRequire('./src/models')

/**
 * Register a new user
 */

module.exports = {
  params: {
  },
  async handler(ctx) {
    const Settings = mongoose.model('Setting')
    const settings = await Settings.find()
    return new FoundResponse('settings', { settings: settings.map(s => s.toApi()) })
  },
}
