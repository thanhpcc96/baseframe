

const mongoose = require('mongoose')
const _ = require('lodash')
const { DateTime } = require('luxon')

const { MoleculerEntityNotFoundError, MoleculerConflictDataError, MoleculerInternalError } = rootRequire('./src/errors')
const { OkResponse } = rootRequire('./src/models')

module.exports = {
  params: {
    igAccountId: 'string',
    userId: 'string',
    full: {
      type: 'boolean',
      optional: true,
    },
  },
  async handler(ctx) {
    const { igAccountId, userId } = ctx.params

    const full = !!ctx.params.full

    const SmartgramUser = mongoose.model('SmartgramUser')
    const InstagramAccount = mongoose.model('InstagramAccount')

    const user = await SmartgramUser.findById(userId).exec()
    if (!user) {
      throw new MoleculerEntityNotFoundError('SmartgramUser')
    }

    // helper
    const igAccount = await InstagramAccount.findOne({
      _id: igAccountId,
      owner: userId,
    }).exec()

    if (!igAccount) {
      throw new MoleculerEntityNotFoundError('igAccount')
    }

    // helper
    const activity = igAccount.toJSON().activity
    if (activity !== 'started' && activity !== 'starting') {
      throw new MoleculerConflictDataError('This instagram account is not started.')
    }

    // check configuration allow stop
    const configurationResponse = await ctx.call('config.get', { name: 'allow.cycle.stop' })

    if (configurationResponse.code !== 200) {
      ctx.broker.logger.error(configurationResponse)
      throw new MoleculerInternalError('Error getting configuration info.', configurationResponse)
    }

    const setting = configurationResponse.data[configurationResponse.type]
    if (setting.value !== true) {
      return Promise.reject(new MoleculerConflictDataError('This action is disabled'))
    }

    // notify bot
    const botResponse = await ctx.call('bot.igAccount.stop', { igAccount, time: Date.now() })
    if (botResponse.code !== 200) {
      throw new MoleculerInternalError('Error stopping bot')
    }

    // show activity
    igAccount.activity = 'stopping'
    await igAccount.save()

    // all ok
    return new OkResponse('igAccount', { igAccount: igAccount.toApi({ full }) })
  },
}

