

const mongoose = require('mongoose')

// Define schema
const Schema = mongoose.Schema
const Mixed = Schema.Types.Mixed

const HistoricModelSchema = new Schema({
  igAccountId: {
    type: String,
    required: true,
  },
  week: {
    type: Number,
    required: true,
  },
  year: {
    type: Number,
    required: true,
  },
  data: {
    type: Mixed,
  },
}, {
  timestamps: false,
  usePushEach: true,
})

// indexes
HistoricModelSchema.index({
  igAccountId: 1,
  week: 1,
  year: 1,
})

// Compile model from schema
mongoose.model('Historic', HistoricModelSchema)
