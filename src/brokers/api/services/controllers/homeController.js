'use strict';

module.exports = function pingController(req, res, next) {
  res.jsonData(200, 'hello', 'Hello there! :-)');
};
