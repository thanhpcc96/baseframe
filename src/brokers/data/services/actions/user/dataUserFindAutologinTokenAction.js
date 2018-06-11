

const mongoose = require('mongoose')

const { MoleculerEntityNotFoundError } = rootRequire('./src/errors')
const { FoundResponse } = rootRequire('./src/models')

module.exports = {
  params: {
    token: 'string',
  },
  async handler(ctx) {
    const { token } = ctx.params

    const conditions = {
      'api.autoLoginToken': token,
      isLocked: false,
    }

    const user = await mongoose.model('SmartgramUser').findOne(conditions).exec()

    if (user) {
      return Promise.resolve(new FoundResponse('user', { user: user.toApi() }))
    }

    return Promise.reject(new MoleculerEntityNotFoundError('user'))
  },
}

