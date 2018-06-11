

const mongoose = require('mongoose')
const { DateTime } = require('luxon')
const _ = require('lodash')

const { MoleculerEntityNotFoundError, MoleculerConflictDataError } = rootRequire('./src/errors')
const { OkResponse } = rootRequire('./src/models')


const VALID_STATUS = [
  'challengedRequired',
  'sentryBlock',
  'loginRequired',
  'fetching',
  'ready',
]

module.exports = {
  params: {
    igAccountId: 'string',
    status: 'string',
    checkpointError: { type: 'object', optional: true },
  },
  async handler(ctx) {
    const { igAccountId, status } = ctx.params

    if (!VALID_STATUS.includes(status)) {
      ctx.broker.logger.error(`dataIgAccountUpdateStatusAction - status not valid, status:${status}`)
      throw new MoleculerConflictDataError('status is not valid :/')
    }

    const InstagramAccount = mongoose.model('InstagramAccount')

    const igAccount = await InstagramAccount.findOne({ igAccountId }).exec()
    if (!igAccount) { throw new MoleculerEntityNotFoundError('igAccount') }

    igAccount.status = status

    // special case. if challenge status then store info for future sync
    if (status === 'challengedRequired') {
      const { checkpointError } = ctx.params

      // first time?
      if (_.isEmpty(igAccount.toJSON().challenge)) {
        igAccount.challenge = {
          createdAt: DateTime.utc().toJSDate(),
        }
      }

      // remember checkpointError doesnt have "resolved", "json"...
      igAccount.challenge.session = checkpointError.session
      igAccount.challenge.checkpointError = _.get(checkpointError, 'json.challenge')
      igAccount.challenge.updatedAt = DateTime.utc().toJSDate()
    }

    await igAccount.save()

    return new OkResponse()
  },
}

