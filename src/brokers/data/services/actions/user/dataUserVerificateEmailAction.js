

const mongoose = require('mongoose')
const _ = require('lodash')

const { MoleculerConflictDataError } = rootRequire('./src/errors')
const { OkResponse } = rootRequire('./src/models')

module.exports = {
  params: {
    token: 'string',
  },
  async handler(ctx) {
    const { token } = ctx.params

    const user = await mongoose.model('SmartgramUser').findOne({ tokenVerifyEmail: token }).exec()
    if (!user) throw new MoleculerConflictDataError('Confirmation link is broken, try a new email.')

    user.emailVerified = true
    user.verificationEmailCount = 0
    await user.save()

    return new OkResponse()
  },
}

