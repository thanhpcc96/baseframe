

// const _ = require('lodash');
// const pino = require('pino');

module.exports = {

  // events
  events: {
    'metrics.trace.span.finish': (payload) => {
      // TODO
      // send metric to some service (ZipKin, OpenTracing, etc)
    },
  },

  // actions
  actions: {
  },

}
