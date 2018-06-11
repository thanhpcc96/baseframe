

const _ = require('lodash')

const { MoleculerError } = require('moleculer').Errors

module.exports = class MoleculerInternalError extends MoleculerError {
  constructor(detail = 'Internal server error.', error = {}) {
    const message = detail
    const code = 500
    const type = 'InternalError'
    const data = {
      title: type,
      detail,
      error,
    }

    super(message, code, type, data)
  }
}
