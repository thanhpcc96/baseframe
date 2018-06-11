

const mongoose = require('mongoose')
const _ = require('lodash')
const { DateTime, Duration } = require('luxon')

const { MoleculerEntityNotFoundError, MoleculerConflictDataError, MoleculerBadRequestError } = rootRequire('./src/errors')
const { OkResponse } = rootRequire('./src/models')

module.exports = {
  params: {
    igAccountId: 'string',
    userId: 'string',
    time: 'number',
    full: {
      type: 'boolean',
      optional: true,
    },
  },
  async handler(ctx) {
    const { igAccountId, userId, time } = ctx.params
    const full = !!ctx.params.full

    const InstagramAccount = mongoose.model('InstagramAccount')
    const SmartgramUser = mongoose.model('SmartgramUser')

    // get data from db
    const userFound = await SmartgramUser.findById(userId).exec()
    const igAccountFound = await InstagramAccount.findOne({ _id: igAccountId, owner: userId }).exec()

    // checks
    if (_.isEmpty(userFound)) {
      return new MoleculerEntityNotFoundError('SmartgramUser')
    }

    if (userFound.isBetaUser !== true) {
      return new MoleculerConflictDataError('Try to add time to a non beta user?')
    }

    if (_.isEmpty(igAccountFound)) {
      return new MoleculerEntityNotFoundError('InstagramAccount')
    }

    const VALID_DATES = [
      Duration.fromObject({ days: 1 }).as('milliseconds'),
      Duration.fromObject({ days: 5 }).as('milliseconds'),
      Duration.fromObject({ days: 10 }).as('milliseconds'),
      Duration.fromObject({ days: 30 }).as('milliseconds'),
    ]

    if (!VALID_DATES.includes(time)) {
      return new MoleculerBadRequestError('Time is not valid')
    }

    const MAX_TIME = Duration.fromObject({ days: 40 }).as('milliseconds')
    if (igAccountFound.time + time > MAX_TIME) {
      return new MoleculerConflictDataError('You can\'t add more than 40 days in all.')
    }

    // all ok. add time and save
    const igAccountUpdated = await InstagramAccount.findOneAndUpdate({
      _id: igAccountId,
      owner: userId,
    }, {
      $inc: { time },
    }).exec()

    return new OkResponse('igAccount', { igAccount: igAccountUpdated.toApi({ full }) })
  },
}

