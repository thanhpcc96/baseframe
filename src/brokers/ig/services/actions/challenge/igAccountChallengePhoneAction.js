

const _ = require('lodash')

const igAccountChallengeBaseAction = require('./igAccountChallengeBaseAction')

/**
 * Register a new user
 */

const action = _.defaultsDeep({}, igAccountChallengeBaseAction)

action.params = _.merge(action.params, {
  phone: 'string',
})

action.handler = async ctx => action.callChallengeMethod(ctx, 'PhoneVerificationChallenge', 'phone', [ctx.params.phone])

module.exports = action
