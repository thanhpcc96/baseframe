

const mongoose = require('mongoose')

// Define schema
const Schema = mongoose.Schema

const StatisticModelSchema = new Schema({
  igAccountId: String,
  measurements: Number,
  data: [{
    medias: Number,
    followers: Number,
    followings: Number,
    takenAt: Date,
  }],
}, {
  timestamps: false,
  usePushEach: true,
})

// indexes
StatisticModelSchema.index({
  igAccountId: 1,
})

// Compile model from schema
mongoose.model('StatisticData', StatisticModelSchema)
