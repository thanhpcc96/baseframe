

const mongoose = require('mongoose')
const _ = require('lodash')

const utils = rootRequire('./src/utils')
const { MoleculerEntityNotFoundError, MoleculerConflictDataError } = rootRequire('./src/errors')
const { OkResponse } = rootRequire('./src/models')

module.exports = {
  params: {
    userId: 'string',
  },
  async handler(ctx) {
    const { userId } = ctx.params

    const user = await mongoose.model('SmartgramUser').findById(userId).exec()

    if (!user) {
      throw new MoleculerEntityNotFoundError('user')
    }

    const userPlain = user.toJSON()

    if (userPlain.verificationEmailCount > 10) {
      throw new MoleculerConflictDataError('Limit of emails reached. Contact user support.')
    }

    // increase counter
    user.verificationEmailCount += 1
    await user.save()

    // send email
    const payload = {
      to: userPlain.email,
      name: userPlain.firstName,
      autoLoginToken: userPlain.api.autoLoginToken,
      tokenVerifyEmail: userPlain.tokenVerifyEmail,
    }

    const responseSendEmail = await ctx.call('email.send.confirmEmail', payload)
    if (responseSendEmail.code !== 200) { throw new Error(responseSendEmail) }

    return new OkResponse()
  },

}

