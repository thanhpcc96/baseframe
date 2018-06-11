

const tough = require('tough-cookie')
const _ = require('lodash')

const Client = require('./../../client')

const { OkResponse } = rootRequire('./src/models')

const {
  igBuildProxyURL,
} = require('./../../utils')

/**
 * Register a new user
 */

module.exports = {
  params: {
    country: 'string',
    deviceSeed: 'string',
    cookies: 'array',
    challengeData: { type: 'object' },
    json: { type: 'object', optional: true },
  },
  handler() {
    throw new Error('handler not implemented')
  },
  async callChallengeMethod(ctx, objectName, methodName, methodParams) {
    const {
      country, deviceSeed, cookies, challengeData, json,
    } = ctx.params

    // device
    const device = new Client.Device(deviceSeed)

    // cookie storage
    const Cookie = tough.Cookie
    const storage = new Client.CookieMemoryStorage()
    _.forEach(cookies, (cookieObject) => {
      const cookie = Cookie.fromJSON(JSON.stringify(cookieObject))
      storage.store.putCookie(cookie, () => {})
    })

    // session
    const session = new Client.Session(device, storage, igBuildProxyURL(ctx, country))

    // challenge
    let challengeInstance = new Client.Web[objectName](session, challengeData, json)

    // call method
    methodParams = _.castArray(methodParams)
    challengeInstance = await challengeInstance[methodName](...methodParams)

    console.log('-------------challengeInstance----------->')
    console.log(challengeInstance)
    console.log('-------------challengeInstance----------->')

    return new OkResponse('challenge', { challenge: await challengeInstance.toApi() })
  },
}

