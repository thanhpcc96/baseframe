

const { DateTime } = require('luxon')
const _ = require('lodash')

const dataControlBase = require('./dataControlBase')

const { OkResponse } = rootRequire('./src/models')

/**
 * main
 */

const action = _.defaultsDeep({}, dataControlBase)

action.handler = async (ctx) => {
  const { state } = ctx.params
  const { igAccountId } = ctx.params.igAccount

  if (!['started', 'stopped'].includes(state)) { throw new Error('state is not valid') }

  const igAccount = await action.findIgAccount(igAccountId)
  igAccount.activity = state
  await igAccount.save()

  return new OkResponse()
}

module.exports = action
