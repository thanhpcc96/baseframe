

const mongoose = require('mongoose')
// let _ = require('lodash');
const { DateTime } = require('luxon')

// Define schema
const Schema = mongoose.Schema

const BotQueueWorkerRegisterModelSchema = new Schema({
  workerId: String,
  nodeID: String,
  queue: String,
  beat: Number,
  lastTickAt: Date,
  status: String,
}, {
  timestamps: true,
  usePushEach: true,
})

// indexes
BotQueueWorkerRegisterModelSchema.index({
  workerId: 1,
})

// Compile model from schema
mongoose.model('BotQueueWorkerRegisterModel', BotQueueWorkerRegisterModelSchema)
