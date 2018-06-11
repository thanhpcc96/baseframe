

const _ = require('lodash')

const igAccountChallengeBaseAction = require('./igAccountChallengeBaseAction')

/**
 * Register a new user
 */

const action = _.defaultsDeep({}, igAccountChallengeBaseAction)

action.params = _.merge(action.params, {
  code: 'string',
})

action.handler = async ctx => action.callChallengeMethod(ctx, 'Challenge', 'code', [ctx.params.code])

module.exports = action
