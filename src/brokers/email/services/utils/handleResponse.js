

const nodemailer = require('nodemailer')
const _ = require('lodash')

const config = rootRequire('config')


module.exports = function (ctx, response) {
  if (config.isDevelopment()) {
    console.log('Message sent: %s', response.messageId)
    // Preview only available when sending through an Ethereal account
    console.log('Preview URL: %s', nodemailer.getTestMessageUrl(response))
  }
  return Promise.resolve(response)
}

