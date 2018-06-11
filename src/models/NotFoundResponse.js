

const Response = require('./Response')

module.exports = class NotFoundResponse extends Response {
  constructor(type, data) {
    super(404, type, data)
  }
}

