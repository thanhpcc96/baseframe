

const mongoose = require('mongoose')
const _ = require('lodash')

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

    // get user
    const userFound = await SmartgramUser.findById(userId).exec()

    if (!userFound) {
      throw new MoleculerEntityNotFoundError('SmartgramUser')
    }

    // get igAccount
    const igAccount = await InstagramAccount.findOne({
      _id: igAccountId,
      owner: userId,
    }).populate('configuration.audience').exec()

    if (!igAccount) {
      throw new MoleculerEntityNotFoundError('igAccount')
    }

    // check status
    const status = igAccount.toJSON().status
    if (!_.isString(status) || status !== 'ready') {
      throw new MoleculerConflictDataError('This Instagram account is not ready.')
    }

    // check audience needed
    if (igAccount.isAudienceNeeded() && _.isEmpty(igAccount.configuration.audience)) {
      throw new MoleculerConflictDataError('This instagram account doesn\'t have an audience set.')
    }

    // check time left
    const time = igAccount.toJSON().time
    if (!_.isNumber(time) || time < 1000) {
      throw new MoleculerConflictDataError('This instagram account doesn\'t have enough time.')
    }

    // check right activity
    const activity = igAccount.toJSON().activity
    if (activity !== 'stopped' && activity !== 'stopping') {
      throw new MoleculerConflictDataError('This instagram account is not stopped.')
    }

    // check some action true!
    const actions = igAccount.toJSON().configuration.actions
    if (!actions.likes && !actions.follows && !actions.unfollows) {
      throw new MoleculerConflictDataError('All automated actions are off.')
    }

    // check config
    const configurationResponse = await ctx.call('config.get', { name: 'allow.cycle.start' })

    if (configurationResponse.code !== 200) {
      ctx.broker.logger.error(configurationResponse)
      throw new MoleculerInternalError('Error getting configuration info.', configurationResponse)
    }

    const setting = configurationResponse.data[configurationResponse.type]
    if (setting.value !== true) {
      throw new MoleculerConflictDataError('Accounts are temporarily stopped')
    }

    // notify bot
    const botResponse = await ctx.call('bot.igAccount.start', { igAccount, time: Date.now() })

    if (botResponse.code !== 200) {
      throw new MoleculerInternalError('Error starting bot.')
    }

    // switch activity our model & remove all notifications
    igAccount.activity = 'starting'
    igAccount.notifications = []
    await igAccount.save()

    // all ok!
    return new OkResponse('igAccount', { igAccount: igAccount.toApi({ full }) })
  },
}

