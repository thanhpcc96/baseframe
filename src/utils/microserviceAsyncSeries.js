'use strict';

const async = require('async');

module.exports = function microserviceAsyncSeries(functions, cb) {
  async.series(functions, (err) => {
    if (err && cb) {
      cb(null, {
        status: 500,
        detail: err,
      });
    }
  });
};
