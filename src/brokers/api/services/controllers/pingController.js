

module.exports = function pingController(req, res) {
  res.jsonData(200, 'pong', {
    application: 'SmartGram API',
  })
}
