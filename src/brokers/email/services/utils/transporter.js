

const nodemailer = require('nodemailer')

const config = rootRequire('config')

/**
 *
 */

let transporter = null

if (config.isDevelopment()) {
  transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: {
      user: 'phqwyfx57eslcz54@ethereal.email',
      pass: 'KMBrRUKKKcHaY2YeGu',
    },
  })
} else {
  throw new Error('TODO email config for prod')
}


module.exports = transporter

