

const { DateTime } = require('luxon')
const mongoose = require('mongoose')
const _ = require('lodash')

const { MoleculerInternalError, MoleculerConflictDataError } = rootRequire('./src/errors')

module.exports = async function handlerIgErrors(ctx, userId, igAccountId, error) {
  switch (error.code) {
  case 429: {
    return ctx.broker.call('data.igAccount.challenge.revive', { igAccountId })
  }

  default:
    ctx.broker.logger.error(error)
    throw error
  }
}

