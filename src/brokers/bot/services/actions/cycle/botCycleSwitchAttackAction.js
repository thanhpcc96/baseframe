

const _ = require('lodash')

const { OkResponse } = rootRequire('./src/models')
const botCycleBaseAction = require('./botCycleBaseAction')

/**
 * main
 */

const action = _.defaultsDeep({}, botCycleBaseAction)

action.handler = async (ctx) => {
  const { igAccount } = ctx.params

  await action.saveCurrentState(igAccount, 'switchAttack')

  const attackState = await getNextAttackSource(ctx, igAccount)
  await action.forwardState(igAccount, attackState, true)

  return new OkResponse()
}

module.exports = action

/**
 * [getNextAttackSource description]
 * @param  {[type]} ctx       [description]
 * @param  {[type]} igAccount [description]
 * @return {[type]}           [description]
 */
async function getNextAttackSource(ctx, igAccount) {
  const isThereAccountsReady = () => !_.isEmpty(igAccount.cycle.ready.attack.accounts)
  const isThereMediasReady = () => !_.isEmpty(igAccount.cycle.ready.attack.medias)

  const followsActionActive = () => igAccount.cycle.configuration.actions.follows === true
  const likesActionActive = () => igAccount.cycle.configuration.actions.likes === true

  if (!isThereAccountsReady() && !isThereMediasReady()) {
    return 'planner'
  }

  const attacks = []

  if (isThereAccountsReady() && followsActionActive()) {
    attacks.push('attackComplete')
  }

  if (isThereMediasReady() && likesActionActive()) {
    attacks.push('attackLike')
  }

  return _.sample(attacks)
}
