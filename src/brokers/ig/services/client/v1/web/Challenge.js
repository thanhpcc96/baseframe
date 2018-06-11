

const _ = require('lodash')
const JSONbig = require('json-bigint')
const errors = require('request-promise/errors')
// const Promise = require('bluebird')
// const util = require('util')
const camelcaseKeys = require('camelcase-keys')

// const Session = require('../session')
// const routes = require('../routes')
// const CONSTANTS = require('../constants')
const WebRequest = require('./web-request')
const Request = require('../request')
// const Helpers = require('../../helpers')
const Exceptions = require('../exceptions')

const { MoleculerConflictDataError } = rootRequire('./src/errors')

let PhoneVerificationChallenge = null
let EmailVerificationChallenge = null
let NotImplementedChallenge = null

/**
 *
 */

/* eslint-disable no-underscore-dangle, class-methods-use-this */

// const ORIGIN = CONSTANTS.WEBHOST.slice(0, -1) // Trailing / in origin

// iPhone probably works best, even from android previosly done request
const iPhoneUserAgent = 'Instagram 19.0.0.27.91 (iPhone6,1; iPhone OS 9_3_1; en_US; en; scale=2.00; gamut=normal; 640x1136) AppleWebKit/420+'
const iPhoneUserAgentHtml = 'Mozilla/5.0 (iPhone; CPU iPhone OS 9_3_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Mobile/13E238 Instagram 10.28.0 (iPhone6,1; iPhone OS 9_3_1; en_US; en; scale=2.00; gamut=normal; 640x1136)'

// const EMAIL_FIELD_REGEXP = /email.*value(.*)"/i
// const PHONE_FIELD_REGEXP = /sms.*value(.*)"/i
// const PHONE_ENTERED_FIELD_REGEXP = /tel.*value="(\+\d+)"/i
// const RESET_FIELD_REGEXP = /reset_progress_form.*action="\/(.*)"/i
const SHARED_JSON_REGEXP = /window._sharedData = (.*);<\/script>/i

/**
 *
 */

module.exports = class Challenge {
  // constructor
  constructor(session, challengeData, json) {
    this.session = session || null
    this.checkpointErrorData = challengeData || null
    this.json = _.isEmpty(json) || _.isNil(json) ? undefined : json
    this.resolved = false

    // check correct format of checkpointError
    const checkpoinAttributes = ['url', 'apiPath', 'hideWebviewHeader', 'lock', 'logout', 'nativeFlow']
    checkpoinAttributes.forEach((a) => {
      if (!Object.prototype.hasOwnProperty.call(this.checkpointErrorData, a)) {
        throw new Error(`checkpointErrorData has a wrong format. ${JSON.stringify(this.checkpointErrorData)}`)
      }
    })

    // private and calculated fields
    this._apiResolveUrl = `https://i.instagram.com/api/v1${this.checkpointErrorData.apiPath}`
    this._webResolveUrl = this.checkpointErrorData.url
    this._apiResetChallengeUrl = this._apiResolveUrl.replace('/challenge/', '/challenge/reset/')

    // here because we have circular dependencies
    PhoneVerificationChallenge = require('./PhoneVerificationChallenge')
    EmailVerificationChallenge = require('./EmailVerificationChallenge')
    NotImplementedChallenge = require('./NotImplementedChallenge')


    console.log('challenge -> constructor --> ')
    console.log(this.checkpointErrorData)
    console.log(this._apiResolveUrl)
    console.log(this._webResolveUrl)
    console.log(this._apiResetChallengeUrl)
    console.log(this.json)
    console.log(this.resolved)
  }

  /**
   * [toApi description]
   * @return {[type]} [description]
   */
  async toApi() {
    return {
      session: this.session ? await this.session.toApi() : undefined,
      json: _.isEmpty(this.json) ? undefined : this.json,
      resolved: !!this.resolved,
      checkpointError: this.checkpointErrorData ? this.checkpointErrorData : undefined,
    }
  }

  // Well, we have two ways of resolving challange. Native and html versions.
  // First of all we reset the challenge. Just to make sure we start from beginning;
  // After we check if we can use native api version. If not - using html;
  // Selecting method and sending code is diffenent, depending on native or html style.
  // As soon as we got the code we can confirm it using Native version.
  // Oh, and code confirm is same now for email and phone checkpoints
  async resolve(defaultMethod = 'phone', skipResetStep = false) {
    const self = this

    console.log('challenge -> resolve()')

    if (!['email', 'phone'].includes(defaultMethod)) throw new Error('Invalid default method')

    // 1. - reset
    if (skipResetStep !== true) {
      await self.reset()
      console.log('challenge -> resolve() -> reset ok')
    }

    // 2. - make request
    const response = await new WebRequest(self.session)
      .setMethod('GET')
      .setUrl(self._apiResolveUrl)
      .setHeaders({
        'User-Agent': iPhoneUserAgent,
      })
      .send({ followRedirect: true })
      .catch(errors.StatusCodeError, error => error.response)

    console.log('challenge -> resolve() -> resolve challenge ok')

    // 3. - handle response
    if (response.body.indexOf('url=instagram://checkpoint/dismiss') !== -1) {
      throw new Exceptions.NoChallengeRequired()
    }

    const json = self.parseResponseBody(response.body)

    if (json.status !== 'ok') {
      throw new Error(`unknown response: ${json}`)
    }

    // Using html unlock if native is not supported
    if (_.get(json, 'challenge.nativeFlow') === false) {
      return self.resolveHtml(defaultMethod)
    }

    // Challenge is not required
    if (json.status === 'ok' && json.action === 'close') {
      throw new Exceptions.NoChallengeRequired()
    }

    // Using API-version of challenge
    switch (json.stepName) {
    case 'select_verify_method': {
      return new WebRequest(self.session)
        .setMethod('POST')
        .setUrl(self._apiResolveUrl)
        .setHeaders({ 'User-Agent': iPhoneUserAgent })
        .setData({ choice: defaultMethod === 'email' ? 1 : 0 })
        .send({ followRedirect: true })
        .then(() => self.resolve(defaultMethod, true))
    }
    case 'verify_code':
    case 'submit_phone': {
      return new PhoneVerificationChallenge(self.session, self.checkpointErrorData, json)
    }
    case 'verify_email': {
      return new EmailVerificationChallenge(self.session, self.checkpointErrorData, json)
    }
    default: return new NotImplementedChallenge(self.session, self.checkpointErrorData, json)
    }
  }

  /**
   * [reset description]
   * @return {[type]} [description]
   */
  async reset() {
    const self = this

    console.log('challenge -> reset()')

    return new Request(self.session)
      .setMethod('POST')
      .setBodyType('form')
      .setUrl(this._apiResetChallengeUrl)
      .setHeaders({ 'User-Agent': iPhoneUserAgent })
      .signPayload()
      .send({ followRedirect: true })
      .catch(error => error.response)
  }

  /**
  * [resolveHtml description]
  * @param  {[type]} defaultMethod [description]
  * @return {[type]}               [description]
  */
  async resolveHtml(defaultMethod) {
  // Using html version
    const self = this

    console.log('challenge -> resolveHtml()')

    if (!['email', 'phone'].includes(defaultMethod)) throw new Error('Invalid default method')

    // 1. - make request
    const response = await new WebRequest(self.session)
      .setMethod('GET')
      .setUrl(self._webResolveUrl)
      .setHeaders({
        'User-Agent': iPhoneUserAgentHtml,
        Referer: self._webResolveUrl,
      })
      .send({ followRedirect: true })
      .catch(errors.StatusCodeError, error => error.response)

    // 2. - parse response
    let json
    let challenge

    if (response.headers['content-type'] === 'application/json') {
      json = self.parseResponseBody(response.body)
      challenge = json
    } else {
      json = self.parseResponseBody(SHARED_JSON_REGEXP.exec(response.body)[1])
      challenge = json.entryData.Challenge[0]
    }

    // 3. - handle response
    let choice
    if (defaultMethod === 'email') {
      choice = challenge.fields.email ? 1 : 0
    } else if (defaultMethod === 'phone') {
      choice = challenge.fields.phoneNumber ? 0 : 1
    } else {
      throw new Error(`dont know this challenge: ${challenge}`)
    }

    switch (challenge.challengeType) {
    case 'SelectVerificationMethodForm': {
      return new WebRequest(self.session)
        .setMethod('POST')
        .setUrl(self._webResolveUrl)
        .setHeaders({
          'User-Agent': iPhoneUserAgentHtml,
          Referer: self._webResolveUrl,
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Instagram-AJAX': 1,
        })
        .setData({ choice })
        .send({ followRedirect: true })
        .then(() => self.resolveHtml(defaultMethod))
    }
    case 'VerifyEmailCodeForm': {
      return new EmailVerificationChallenge(self.session, self.checkpointErrorData, json)
    }
    case 'VerifySMSCodeForm': {
      return new PhoneVerificationChallenge(self.session, self.checkpointErrorData, json)
    }
    default:
      return new NotImplementedChallenge(self.session, self.checkpointErrorData, json)
    }
  }

  /**
  * [code description]
  * @param  {[type]} securityCode [description]
  * @return {[type]}              [description]
  */
  async code(securityCode) {
    const self = this

    console.log('challenge -> code()')

    if (_.isNil(securityCode) || securityCode.length !== 6) {
      throw new Error('Invalid code provided')
    }

    // 1. - make request
    const response = await new WebRequest(self.session)
      .setMethod('POST')
      .setUrl(this._apiResolveUrl)
      .setHeaders({
        'User-Agent': iPhoneUserAgent,
      })
      .setBodyType('form')
      .setData({
        security_code: securityCode,
      })
      .removeHeader('x-csrftoken')
      .send({ followRedirect: false })
      .catch(errors.StatusCodeError, (reason) => {
        if (reason.statusCode === 400) {
          throw new MoleculerConflictDataError('It looks like if the code is wrong.')
        }
        throw reason
      })

    // 2. - parse response
    const json = self.parseResponseBody(response.body)

    // all ok => we rock!
    if (response.statusCode === 200 && json.status === 'ok' && (json.action === 'close' || json.location === 'instagram://checkpoint/dismiss')) {
      self.resolved = true
      return self
    }

    // unknow error
    console.log('----- unknow error => ')
    console.log(json)
    throw new Exceptions.NotPossibleToResolveChallenge('Unknown error', Exceptions.NotPossibleToResolveChallenge.CODE.UNKNOWN)
  }

  /**
  * [parseResponseBody description]
  * @param  {[type]} body [description]
  * @return {[type]}      [description]
  */
  parseResponseBody(body) {
    let json

    console.log(`challenge -> parseResponseBody(${body})`)

    try {
      json = JSONbig.parse(body)
    } catch (e) {
      throw new TypeError(`Invalid response. JSON expected, response: ${body}`)
    }

    if (json.user_id) {
      json.igAccountId = json.user_id.toString()
      delete json.user_id
    }

    json = camelcaseKeys(json, { deep: true })

    console.log(`challenge -> parseResponseBody() => ${JSON.stringify(json)}`)

    return json
  }
}
