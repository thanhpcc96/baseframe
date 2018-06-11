

const _ = require('lodash')
const stringify = require('json-stringify-safe')

const { OkResponse } = rootRequire('./src/models')
const Queue = rootRequire('./src/brokers/bot/queue/Queue')

// handleIgError
module.exports = async function handleIgError(ctx, igAccount, response = {}) {
  // if no error => nothing
  // if error is 'sentry_block' or 'challenge_required' then:
  // 1. send message user action required to data
  // 2. stop bot state (let other services know it)

  // legend:
  // code 410 => challenged_required
  // code 411 => sentry_block
  // code 412 => login_required

  if (ctx.constructor.name !== 'Context') {
    throw new Error('DI error -> handlerIgError -> expected moleculer context')
  }

  const igAccountId = igAccount.igAccountId
  const responseSecure = JSON.parse(stringify(response))

  console.log(`bog - handleIgError, igAccountId: ${igAccountId}, response:${stringify(response)}`)
  ctx.broker.logger.debug(`bog - handleIgError, igAccountId: ${igAccountId}, response:${stringify(response)}`)

  /*
  // no error -> nothing
  if ([200, 201].includes(response.code)) {
    return response
  }
  */

  // yes error
  let payload = { igAccountId }

  switch (response.code) {
  case 410:
    payload = _.merge(payload, { errorType: 'challengedRequired', checkpointError: responseSecure })
    break
  case 411:
    payload = _.merge(payload, { errorType: 'sentryBlock' })
    break
  case 412:
    payload = _.merge(payload, { errorType: 'loginRequired' })
    break
  default:
    // we asumme if the error is not handled here, it will be on queueWorker
    throw responseSecure
  }

  // 1. inform data with new status and notification to user
  await ctx.broker.call('data.igAccount.status.update', payload)
  await ctx.broker.call('data.igAccount.notification.create', payload)

  // 2. stop statistics
  await this.broker.call('statistic.control.stopped', { igAccount })

  // 3. stop bot
  await Queue.add('cycle', 'stop', igAccountId)

  // 4. After enqueue stop state we have to finish successfully
  return new OkResponse()
}
