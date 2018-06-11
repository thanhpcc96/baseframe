
const _ = require('lodash')

module.exports = async function handleError(ctx, igAccount, error = {}) {
  // if error is 'sentry_block' or 'challenge_required' then:
  // 1. send message user action required to data
  // 1. stop bot state (let other services know it)

  // legend:
  // code 410 => challenged_required
  // code 411 => sentry_block
  // code 412 => login_required

  if ([410, 411, 412].includes(error.code)) {
    let errorType = null

    switch (error.code) {
    case 410:
      errorType = 'challengedRequired'
      break
    case 411:
      errorType = 'sentryBlock'
      break
    case 412:
      errorType = 'loginRequired'
      break
    default:
      throw new Error(error)
    }

    await ctx.broker.call('data.igAccount.notification.create', { igAccountId: igAccount.igAccountId, type: errorType })
    await ctx.broker.call('data.igAccount.status.update', { igAccountId: igAccount.igAccountId, status: errorType })

    await forwardState(igAccount, 'stop', false)
    return new OkResponse()
  }

  // we asumme if the error is not handled here it will be on queueWorker
  throw error
}
