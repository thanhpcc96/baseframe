

const tough = require('tough-cookie')
const _ = require('lodash')

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
    country: 'string',
    checkpointError: {
      type: 'object',
    },
  },
  async handler(ctx) {
    const { country, checkpointError } = ctx.params

    const device = new Client.Device(checkpointError.session.deviceSeed)
    const storage = new Client.CookieMemoryStorage()

    const Cookie = tough.Cookie
    _.forEach(checkpointError.session.cookies, (cookieObject) => {
      const cookie = Cookie.fromJSON(JSON.stringify(cookieObject))
      storage.store.putCookie(cookie, () => {})
    })

    // after build the session object we remove the original session data. Avoiding future confusions
    delete checkpointError.session

    const session = new Client.Session(device, storage, igBuildProxyURL(ctx, country))

    const challenge = new Client.Web.Challenge(session)
    const challengeResult = await challenge.resolve(checkpointError)

    console.log('-------------challengeResult----------->')
    console.log(challengeResult)
    console.log('-------------challengeResult----------->')

    return new OkResponse('challenge', { challenge: await challengeResult.toApi() })
  },
}
