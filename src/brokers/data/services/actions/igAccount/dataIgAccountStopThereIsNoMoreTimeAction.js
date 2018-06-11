

const mongoose = require('mongoose')
const { DateTime } = require('luxon')

const { MoleculerEntityNotFoundError, MoleculerConflictDataError } = rootRequire('./src/errors')
const { OkResponse, NotFoundResponse } = rootRequire('./src/models')

module.exports = {
  params: {
    igAccountId: 'string',
  },
  async handler(ctx) {
    const { igAccountId } = ctx.params

    const igAccount = await mongoose.model('InstagramAccount').findOne({ igAccountId }).exec()

    if (!igAccount) { throw new MoleculerEntityNotFoundError('igAccount') }

    if (igAccount.getTimeLeft() > 0) {
      throw new MoleculerConflictDataError('There is time on this account!')
    }

    // add notification to account
    await ctx.broker.call('data.igAccount.notification.create', {
      igAccountId: igAccount.igAccountId,
      type: 'thereIsNoMoreTime',
    })

    // notify bot to stop igAccount
    await ctx.call('bot.control.stop', { igAccount, time: Date.now() })

    // update our model
    igAccount.activity = 'stopping'
    await igAccount.save()

    // send email notification
    const owner = await mongoose.model('SmartgramUser').findOne({ _id: igAccount.owner }).exec()
    await ctx.broker.call('email.send.thereIsNoMoreTime', {
      to: owner.email,
      name: owner.firstName,
      accountUsername: igAccount.username,
      tokenVerifyEmail: owner.tokenVerifyEmail,
      autoLoginToken: owner.api.autoLoginToken,
    })

    // all done!
    return new OkResponse()
  },
}

