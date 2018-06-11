

const nodemailer = require('nodemailer')
const _ = require('lodash')

const config = rootRequire('config')


module.exports = function (ctx, error) {
  if (error) {
    // TODO -> send error to some log....
    console.log('---------------error---------------->')
    console.log('---------------error---------------->')
    console.log('---------------error---------------->')
    console.log('---------------error---------------->')
    console.log(error)
  }

  return Promise.reject(error)
}
