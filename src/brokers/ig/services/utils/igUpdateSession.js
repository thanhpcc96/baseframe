

const _ = require('lodash')

const Client = require('./../client')

module.exports = async function igUpdateSession(ctx, igAccount, session) {
  if (_.isEmpty(ctx) || _.isEmpty(igAccount) || !(session instanceof Client.Session)) {
    throw new Error('invaid parameters :/')
  }

  const igAccountId = igAccount.igAccountId
  const cookies = await session.cookieStore.getCookies()

  if (_.isEmpty(cookies)) {
    throw new Error('cookies are empty :/')
  }

  const response = await ctx.call('bot.igAccount.updateSessionCookies', { igAccountId, cookies })

  if (response.code !== 200) {
    ctx.broker.logger.error(response)
    throw new Error(response)
  }

  return response.data[response.type]
}

