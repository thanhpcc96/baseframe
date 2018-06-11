

const { DateTime } = require('luxon')
const _ = require('lodash')

const dataControlBase = require('./dataControlBase')

const { OkResponse } = rootRequire('./src/models')

/**
 * main
 */

const action = _.defaultsDeep({}, dataControlBase)

action.handler = async (ctx) => {
  const { igAccountId } = ctx.params.igAccount

  const igAccount = await action.findIgAccount(igAccountId)

  igAccount.activity = 'stopped'
  igAccount.cycle.stoppedAt = DateTime.utc().toJSDate()
  await igAccount.save()

  return new OkResponse()
}

module.exports = action
