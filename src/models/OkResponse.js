

const Response = require('./Response')

module.exports = class OkResponse extends Response {
  constructor(type, data) {
    super(200, type, data)
  }
}

