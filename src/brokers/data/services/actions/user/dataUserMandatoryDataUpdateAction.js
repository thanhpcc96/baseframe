

const mongoose = require('mongoose')
const _ = require('lodash')

const utils = rootRequire('./src/utils')
const { MoleculerEntityNotFoundError, MoleculerConflictDataError } = rootRequire('./src/errors')
const { FoundResponse } = rootRequire('./src/models')

module.exports = {
  params: {
    userId: 'string',
    firstName: 'string',
    lastName: 'string',
    email: 'string',
  },
  async handler(ctx) {
    const { userId } = ctx.params
    let { firstName, lastName, email } = ctx.params

    const SmartgramUser = mongoose.model('SmartgramUser')

    const options = {}
    email = await utils.normalizeEmail(email, options)

    // normalize name and lastname
    firstName = firstName.replace(/(\r\n|\n|\r)/gm, '') // remove new line
    lastName = lastName.replace(/(\r\n|\n|\r)/gm, '') // remove new line


    const user = await SmartgramUser.findById(userId).exec()
    if (!user) {
      throw new MoleculerEntityNotFoundError('user')
    }

    // detectChanges
    const newData = _.pick(user.toObject(), ['email', 'firstName', 'lastName'])
    const oldData = { email, firstName, lastName }

    if (_.isEqual(newData, oldData)) {
      throw new MoleculerConflictDataError('Nothing to update.')
    }

    // update email
    if (user.toObject().email !== email) {
      const anotherUserWithThisEmail = await SmartgramUser.findOne({ _id: { $ne: user._id }, email }).exec()
      if (anotherUserWithThisEmail) {
        throw new MoleculerConflictDataError('Email address already in use.')
      }

      // update fields
      user.emailVerified = false
      user.email = email
      await user.save()

      // send email (dont wait for it)
      const payload = {
        to: user.email,
        name: user.firstName,
        autoLoginToken: user.api.autoLoginToken,
        tokenVerifyEmail: user.tokenVerifyEmail,
      }
      ctx.call('email.send.confirmEmail', payload)
    }

    // update other things
    user.firstName = firstName
    user.lastName = lastName
    await user.save()

    // all ok
    return new FoundResponse('user', { user: user.toApi() })
  },
}

