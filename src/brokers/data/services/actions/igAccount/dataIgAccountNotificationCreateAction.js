

const mongoose = require('mongoose')
const { DateTime } = require('luxon')

const { MoleculerEntityNotFoundError, MoleculerConflictDataError } = rootRequire('./src/errors')
const { OkResponse } = rootRequire('./src/models')

/**
 * Register a new user
 */

const VALID_TYPES = [
  'thereIsNoMoreTime',
  'internalError',
  'badCredentials',
  'restartToApplyChanges',
  'invalidIgAccountConfiguration',
  'noMoreActionsToDo',
  'challengedRequired',
  'sentryBlock',
  'loginRequired',
]

module.exports = {
  params: {
    igAccountId: 'string',
    type: 'string',
    payload: {
      type: 'object',
      optional: true,
    },
  },
  async handler(ctx) {
    const { igAccountId, type, payload } = ctx.params
    const InstagramAccount = mongoose.model('InstagramAccount')

    if (!VALID_TYPES.includes(type)) {
      ctx.broker.logger.error(`dataIgAccountNotificationAction - Notification type not valid, type:${type}`)
      throw new MoleculerConflictDataError('type is not valid :/')
    }

    const igAccount = await InstagramAccount.findOne({ igAccountId }).exec()
    if (!igAccount) { throw new MoleculerEntityNotFoundError('igAccount') }

    const notification = {
      createdAt: DateTime.utc().toJSDate(),
      payload,
      type,
    }

    igAccount.notifications = igAccount.toJSON().notifications.filter(n => n.type !== type)

    igAccount.notifications.push(notification)
    await igAccount.save()

    return new OkResponse()
  },
}

