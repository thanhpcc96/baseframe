

const _ = require('lodash')

const igAccountChallengeBaseAction = require('./igAccountChallengeBaseAction')

/**
 * Register a new user
 */

const action = _.defaultsDeep({}, igAccountChallengeBaseAction)

action.handler = async ctx => action.callChallengeMethod(ctx, 'Challenge', 'resolve')

module.exports = action
