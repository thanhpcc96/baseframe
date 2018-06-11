

const _ = require('lodash')

const statisticControlBase = require('./statisticControlBase')

const { OkResponse } = rootRequire('./src/models')

/**
 * main
 */

const action = _.defaultsDeep({}, statisticControlBase)

action.handler = async (ctx) => {
  const { igAccountId } = ctx.params.igAccount
  await action.updateIgAccountControlActivity(igAccountId, 'stopped')
  return new OkResponse()
}

module.exports = action
