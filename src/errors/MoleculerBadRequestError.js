

const _ = require('lodash')

const { MoleculerError } = require('moleculer').Errors

module.exports = class MoleculerBadRequestError extends MoleculerError {
  constructor(detail = '', title = '', metadata = null) {
    const message = detail
    const code = 400
    const type = 'BadRequest'
    const data = {
      title: _.isEmpty(title) ? 'BadRequest' : title,
      detail,
    }

    if (metadata !== null) {
      data.metadata = metadata
    }

    super(message, code, type, data)
  }
}
