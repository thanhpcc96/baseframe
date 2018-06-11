

const Client = require('./../client')
const igBuildProxyURL = require('./igBuildProxyURL')

const _ = require('lodash')
const tough = require('tough-cookie')

const Cookie = tough.Cookie

module.exports = async function igBuildSession(ctx, igAccount) {
  if (_.isEmpty(igAccount) || _.isEmpty(igAccount.igAccountId)) {
    throw new Error('igAccount not valid')
  }

  if (!_.isArray(igAccount.cookies) || igAccount.cookies.length <= 0) {
    throw new Error('cookies not valid')
  }

  const device = new Client.Device(igAccount.username)
  const storage = new Client.CookieMemoryStorage()

  _.forEach(igAccount.cookies, (cookieObject) => {
    const cookie = Cookie.fromJSON(JSON.stringify(cookieObject))
    storage.store.putCookie(cookie, () => {})
  })

  return new Client.Session(device, storage, igBuildProxyURL(ctx, igAccount.cycle.configuration.country))
}
