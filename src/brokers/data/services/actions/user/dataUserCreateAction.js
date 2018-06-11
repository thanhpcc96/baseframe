

const moment = require('moment')
const { DateTime } = require('luxon')
const _ = require('lodash')
const mongoose = require('mongoose')
const uuidv4 = require('uuid/v4')
const uuidv1 = require('uuid/v1')
const geoip = require('geoip-lite')
const iso3166 = require('iso-3166-1')

const utils = rootRequire('./src/utils')
const { MoleculerConflictDataError } = rootRequire('./src/errors')
const { CreatedResponse } = rootRequire('./src/models')

/**
 * Register a new user
 */

module.exports = {
  params: {
    email: 'string',
    firstName: 'string',
    lastName: 'string',
    password: 'string',
    ip: {
      type: 'string',
      optional: true,
    },
  },
  async handler(ctx) {
    const SmartgramUser = mongoose.model('SmartgramUser')

    let {
      firstName, lastName, email, password,
    } = ctx.params
    const { ip } = ctx.params

    // normalize email
    const options = {}
    email = await utils.normalizeEmail(email, options)

    // normalize name and lastname
    firstName = firstName.replace(/(\r\n|\n|\r)/gm, '') // remove new line
    lastName = lastName.replace(/(\r\n|\n|\r)/gm, '') // remove new line

    // check email already with us
    const userFound = await SmartgramUser.findOne({ email })
    if (userFound) {
      throw new MoleculerConflictDataError('Email address already in use.')
    }

    // get isEnabled config
    const configResponse = await ctx.call('config.get', { name: 'account.default.actived' })
    if (configResponse.code !== 200) { throw configResponse }
    const isEnabled = configResponse.data[configResponse.type].value

    // get ip info -> country
    const geo = geoip.lookup(ip)
    let country = null
    if (geo && geo.country) {
      country = iso3166.whereAlpha2(geo.country)
    }

    // build user
    const user = new SmartgramUser({
      // msg input
      firstName,
      lastName,
      email,
      password,
      // calculated!
      country,
      // defaults!
      emailVerified: false,
      verificationEmailCount: 0,
      tokenVerifyEmail: getSecureToken(),
      createdAt: DateTime.utc().toJSDate(),
      failedLoginCount: 0,
      api: {
        refreshToken: getSecureToken(),
        autoLoginToken: getSecureToken(),
      },
      // config service
      isEnabled,
    })

    // save user
    await user.save()

    // dont wait for sending the email
    ctx.broker.call('email.send.welcome', {
      name: firstName, to: email, autoLoginToken: user.api.autoLoginToken, tokenVerifyEmail: user.tokenVerifyEmail,
    })

    // all ok
    return new CreatedResponse('user', { user: user.toApi() })
  },
}

/**
 * [getSecureToken description]
 * @return {[type]} [description]
 */
function getSecureToken() {
  return `${uuidv4()}-${uuidv1()}-${uuidv4()}-${uuidv1()}`
}
