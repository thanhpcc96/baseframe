

const _ = require('lodash')

module.exports = async function addHistoricEntry(ctx, igAccount, actionName, payload = null, time = Date.now()) {
  // ctx.broker.logger.debug('igUtils - addHistoricEntry', { igAccountId: igAccount.igAccountId, actionName, payload })

  const response = await ctx.broker.call('historical.add.entry', {
    igAccountId: igAccount.igAccountId,
    action: actionName,
    payload,
    time,
  })

  if (response.code !== 200) {
    ctx.broker.logger.error(response)
    throw new Error(response)
  }

  return response
}
