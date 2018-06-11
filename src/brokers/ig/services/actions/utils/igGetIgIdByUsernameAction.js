

const _ = require('lodash')
const errors = require('request-promise/errors')
const camelcaseKeys = require('camelcase-keys')

const Client = require('./../../client')

const { MoleculerConflictDataError, MoleculerInternalError, MoleculerEntityNotFoundError } = rootRequire('./src/errors')
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
    username: 'string',
  },
  async handler(ctx) {
    const { country, username } = ctx.params

    const device = new Client.Device(username)
    const storage = new Client.CookieMemoryStorage()
    const session = new Client.Session(device, storage, igBuildProxyURL(ctx, country))

    const url1 = `https://www.instagram.com/${username}`
    const url2 = `https://www.instagram.com/${username}/?__a=1`

    console.log(1)
    console.log(url1)

    const response1 = await new Client.Web.Request(session)
      .setMethod('GET')
      .setUrl(url1)
      .send({ followRedirect: true })
      // .catch(errors.StatusCodeError, error => error.response)

    console.log(2)

    const response2 = await new Client.Web.Request(session)
      .setMethod('GET')
      .setUrl(url2)
      .setHeaders({
        Referer: url1,
        'X-Instagram-AJAX': 1,
      })
      .send({ followRedirect: true })
      // .catch(errors.StatusCodeError, error => error.response)

    console.log(3)

    let json
    try {
      json = JSON.parse(response2.body)
      json = camelcaseKeys(json, { deep: true })
    } catch (e) {
      throw new TypeError('Invalid response. JSON expected')
    }

    console.log(4)

    const igAccountId = _.get(json, 'graphql.user.id', '')

    if (_.isNil(igAccountId) || _.isEmpty(igAccountId)) {
      throw new MoleculerInternalError('Error getting igAccountId from json response')
    }

    console.log(5)

    return new OkResponse('igAccountId', { igAccountId: igAccountId.toString() })
  },
}
