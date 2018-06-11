

const { DateTime } = require('luxon')
const mongoose = require('mongoose')
const _ = require('lodash')

const { MoleculerInternalError, MoleculerConflictDataError } = rootRequire('./src/errors')

module.exports = async function updateIgAccountChallenge(ctx, igAccountId, challengeData) {
  const InstagramAccount = mongoose.model('InstagramAccount')

  const status = _.get(challengeData, 'json.status')
  const action = _.get(challengeData, 'json.action')

  if (status === 'ok' && action === 'close') {
    throw new MoleculerConflictDataError('Wrong number phone.')
  }

  if (!['verify_code', 'verify_email', 'submit_phone'].includes(_.get(challengeData, 'json.stepData'))) {
    ctx.broker.logger.debug(`Challenge unknown, challengeData: ${JSON.stringify(challengeData)}`)
    throw new MoleculerInternalError('Unknown challenge step.')
  }

  const igAccount = await InstagramAccount.findOne({ igAccountId }).exec()
  if (_.isEmpty(igAccount)) { throw new MoleculerInternalError('Couldn\'t find model to update?..') }

  // first time?
  if (_.isEmpty(igAccount.toJSON().challenge)) {
    igAccount.challenge = {
      createdAt: DateTime.utc().toJSDate(),
    }
  }

  igAccount.challenge.session = challengeData.session
  igAccount.challenge.json = challengeData.json
  igAccount.challenge.resolved = challengeData.resolved
  igAccount.challenge.checkpointError = challengeData.checkpointError
  igAccount.challenge.updatedAt = DateTime.utc().toJSDate()

  await igAccount.save()

  return igAccountUpdate
}

