

const _ = require('lodash')

const utils = require('./../utils')

const { OkResponse } = rootRequire('./src/models')

module.exports = {
  params: {
    to: 'string',
    name: 'string',
    tokenVerifyEmail: 'string',
    autoLoginToken: 'string',
  },
  handler(ctx) {
    const {
      to, name, tokenVerifyEmail, autoLoginToken,
    } = ctx.params

    const variables = _.defaults({ to, name }, utils.defaultVariables({ tokenVerifyEmail, autoLoginToken }))

    return Promise.resolve()
      .then(() => utils.compileTemplate(ctx, 'confirmEmail', variables))
      .then((html) => {
        let mailOptions = {
          to,
          html,
          subject: 'SmartGram - Confirm your email',
        }

        mailOptions = _.defaults(mailOptions, utils.defaultOptions())

        return utils.transporter.sendMail(mailOptions)
      })
      .then(response => utils.handleResponse(ctx, response))
      .then(() => new OkResponse())
      .catch(error => utils.handleError(ctx, error))
  },

}
