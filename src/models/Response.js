

module.exports = class Response {
  constructor(code, type, data) {
    this.code = code || -1
    this.type = type || 'undefined'
    this.data = data || null
  }
}
