

const _ = require('lodash')

const { MoleculerError } = require('moleculer').Errors

module.exports = class MoleculerRequiredActionUserError extends MoleculerError {
  constructor(detail = '', title = '', challenge = {}) {
    const message = detail
    const code = 410
    const type = 'RequiredActionUser'
    const data = {
      title: _.isEmpty(title) ? 'RequiredActionUser' : title,
      detail,
      challenge,
    }

    super(message, code, type, data)
  }
}
