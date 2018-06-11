

// const Client = require('instagram-private-api').V1
const Client = require('./../../client')

const { OkResponse } = rootRequire('./src/models')

const {
  igApiErrorHandler,
  igBuildProxyURL,
} = require('./../../utils')

/**
 * Register a new user
 */

module.exports = {
  params: {
    username: 'string',
    password: 'string',
    country: 'string',
  },
  async handler(ctx) {
    const { username, password, country } = ctx.params

    const device = new Client.Device(username)
    const storage = new Client.CookieMemoryStorage()
    const session = new Client.Session(device, storage, igBuildProxyURL(ctx, country))

    try {
      await Client.Session.login(session, username, password)
    } catch (error) {
      return error.toApi()
    }

    const igAccountId = await storage.getAccountId()
    const cookies = await storage.getCookies()

    return new OkResponse('igAccountLoginRaw', { igAccountLoginRaw: { igAccountId, cookies } })
  },
}
