

const mongoose = require('mongoose')

const { MoleculerEntityNotFoundError } = rootRequire('./src/errors')
const { FoundResponse } = rootRequire('./src/models')

module.exports = {
  params: {
    refreshToken: 'string',
  },
  handler(ctx) {
    const SmartgramUser = mongoose.model('SmartgramUser')

    return SmartgramUser
      .findOne({
        'api.refreshToken': ctx.params.refreshToken,
        isLocked: false,
      })
      .exec()
      .then((user) => {
        if (user) {
          return Promise.resolve(new FoundResponse('user', { user: user.toApi() }))
        }
        return Promise.reject(new MoleculerEntityNotFoundError('user'))
      })
  },
}

