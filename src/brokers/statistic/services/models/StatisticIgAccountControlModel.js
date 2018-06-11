

const mongoose = require('mongoose')

// Define schema
const Schema = mongoose.Schema

const IgAccountControlModelSchema = new Schema({
  igAccountId: {
    type: String, required: true,
  },
  activity: {
    type: String, enum: ['stopped', 'started'], required: true, default: 'stopped',
  },
  lastTakenAt: {
    type: Date, default: null,
  },
}, {
  timestamps: false,
  usePushEach: true,
})

// indexes
IgAccountControlModelSchema.index({
  igAccountId: 1,
})

// Compile model from schema
mongoose.model('IgAccountControl', IgAccountControlModelSchema)
