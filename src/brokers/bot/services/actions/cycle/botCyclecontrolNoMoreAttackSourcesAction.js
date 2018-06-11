

const _ = require('lodash')

const { OkResponse } = rootRequire('./src/models')
const utils = rootRequire('./src/utils')
const botCycleBaseAction = require('./botCycleBaseAction')

/**
 * main
 */

const action = _.defaultsDeep({}, botCycleBaseAction)

action.handler = async (ctx) => {
  const { igAccount } = ctx.params

  await action.saveCurrentState(igAccount, 'controlNoMoreAttackSources')

  // check attack source is valid
  const attacksource = igAccount.cycle.configuration.sources.attack
  if (!['all', 'feed', 'audience'].includes(attacksource)) { throw new Error('attack source is not valid :/') }

  const thereIsNotAttackAccountOrMedia = _.isEmpty(igAccount.cycle.ready.attack.accounts) && _.isEmpty(igAccount.cycle.ready.attack.medias)
  const onlyAttackSourceFeed = attacksource === 'feed'

  // if only working with attack feed and we dont get results (accounts or medias) then stop bot
  if (onlyAttackSourceFeed && thereIsNotAttackAccountOrMedia) {
    await ctx.broker.call('data.igAccount.notification.create', { igAccountId: igAccount.igAccountId, type: 'noMoreActionsToDo' })
    await action.forwardState(igAccount, 'stop', false)
  } else {
    await action.forwardState(igAccount, 'switchAttack', false)
  }

  return new OkResponse()
}

module.exports = action

