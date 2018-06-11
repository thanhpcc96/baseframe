'use strict';

let mongoose = require('mongoose');
let _ = require('lodash');
const { DateTime } = require('luxon');
let Schema = mongoose.Schema;

/**
 * Main
 */

//const modelsCompiled = [];

module.exports = function compileJobTypeModel() {

  let schema = new Schema({
    status: {
      type: String,
      enum: ['enqueue', 'failed', 'completed', 'invalidated'],
      required: true,
      default: 'enqueue',
    },
    command: {
      type: String,
      required: true,
    },
    runAt: {
      type: Date,
      required: true,
    },
    payload: {
      type: Schema.Types.Mixed,
      required: false,
    },

    /*
    lockedAt: {
      type: Date,
      required: false,
      default: null,
    },
    */
    finishedAt: {
      type: Date,
      required: false,
      default: null,
    },
    failedAt: {
      type: Date,
      required: false,
      default: null,
    },

    /*
    error: {
      type: Schema.Types.Mixed,
      required: false,
    },
    result: {
      type: Schema.Types.Mixed,
      required: false,
    },
    */
  }, {
    timestamps: false,
    usePushEach: true,
    _id: true,
  });

  //indexes
  schema.index({
    command: 1,
    status: 1,
    runAt: 1,
  });

  return schema;
};

