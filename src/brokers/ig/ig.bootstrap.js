'use strict';

const IgBroker = require('./IgBroker');
const cluster = rootRequire('./src/cluster.js');

cluster(() => {

  new IgBroker().start();

});
