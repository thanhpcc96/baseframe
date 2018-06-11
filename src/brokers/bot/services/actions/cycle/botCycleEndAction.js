

const _ = require('lodash')
const mongoose = require('mongoose')

const { OkResponse } = rootRequire('./src/models')
const botCycleBaseAction = require('./botCycleBaseAction')

const InstagramAccount = mongoose.model('InstagramAccount')

/**
 * main
 */

const action = _.defaultsDeep({}, botCycleBaseAction)

action.handler = async (ctx) => {
  const { igAccount } = ctx.params

  await action.saveCurrentState(igAccount, 'end')
  await action.forwardState(igAccount, 'configuration')

  return new OkResponse()
}

module.exports = action
