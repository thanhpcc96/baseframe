

const mongoose = require('mongoose')
const _ = require('lodash')

const { FoundResponse, NotFoundResponse } = rootRequire('./src/models')

/**
 * Register a new user
 */

module.exports = {
  params: {
    name: 'string',
  },
  async handler(ctx) {
    const { name } = ctx.params
    const Setting = mongoose.model('Setting')

    const query = { name }

    const setting = await Setting.findOne(query).exec()

    if (setting) {
      return new FoundResponse('setting', { setting: setting.toApi() })
    }

    return new NotFoundResponse()
  },
}
