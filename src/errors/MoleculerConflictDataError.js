

const _ = require('lodash')

const { MoleculerError } = require('moleculer').Errors

module.exports = class MoleculerConflictDataError extends MoleculerError {
  constructor(detail = '', title = '', metadata = null) {
    const message = detail
    const code = 409
    const type = 'ConflictData'
    const data = {
      title: _.isEmpty(title) ? 'ConflictData' : title,
      detail,
    }

    if (metadata !== null) {
      data.metadata = metadata
    }

    super(message, code, type, data)
  }
}
