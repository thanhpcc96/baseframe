'use strict';

const mongoose = require('mongoose');

module.exports = function disconnectMongoose() {
  mongoose.disconnect();
};
