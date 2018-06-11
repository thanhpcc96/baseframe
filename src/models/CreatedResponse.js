

const Response = require('./Response')

module.exports = class CreatedResponse extends Response {
  constructor(type, data) {
    super(201, type, data)
  }
}

