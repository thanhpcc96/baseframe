

const _ = require('lodash')


const camelKeys = require('camelcase-keys')
const errors = require('request-promise/errors')

const WebRequest = require('./web-request')
const Challenge = require('./Challenge')

const { MoleculerConflictDataError } = rootRequire('./src/errors')

/**
 *
 */

/* eslint-disable no-underscore-dangle, class-methods-use-this */

const iPhoneUserAgent = 'Instagram 19.0.0.27.91 (iPhone6,1; iPhone OS 9_3_1; en_US; en; scale=2.00; gamut=normal; 640x1136) AppleWebKit/420+'

module.exports = class PhoneVerificationChallenge extends Challenge {
  // constructor
  constructor(session, checkpointError, json) {
    super(session, checkpointError, json)
    this.submitPhone = json.stepName === 'submit_phone'
  }

  /**
   * [phone description]
   * @param  {[type]} phone [description]
   * @return {[type]}       [description]
   */
  async phone(phoneNumberIn) {
    const self = this

    console.log('challenge -> phone()')

    if (self.submitPhone === false) {
      return self
    }

    const instaPhone = _.get(self.json, 'stepData.phoneNumber', null)
    const phoneNumber = phoneNumberIn || instaPhone
    if (_.isEmpty(phoneNumber)) throw new Error('Invalid phone number')

    console.log(`sending phone, phone: ${phoneNumber}`)

    // 1. - make request
    const response = await new WebRequest(self.session)
      .setMethod('POST')
      .setUrl(self._apiResolveUrl)
      .setHeaders({ 'User-Agent': iPhoneUserAgent })
      .setBodyType('form')
      .setData({ phone_number: phoneNumber })
      .removeHeader('x-csrftoken')
      .send({ followRedirect: false })
      .catch(errors.StatusCodeError, (reason) => {
        if (reason.statusCode === 400) {
          throw new MoleculerConflictDataError('Looks like your phone number may be incorrect. Please try entering your full number, including the country code.')
        }
        throw reason
      })

    console.log('response.body  ---> ')
    console.log(response.body)

    // 2. - parse
    const json = self.parseResponseBody(response.body)

    console.log('response.body -> json ---> ')
    console.log(json)

    // 3. - response
    return new PhoneVerificationChallenge(self.session, self.checkpointErrorData, json)
  }
}

