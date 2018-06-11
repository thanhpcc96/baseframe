

const mongoose = require('mongoose')

// Define schema
const Schema = mongoose.Schema

const ListAccountFollowingsMadeModelSchema = new Schema({
  from: {
    type: String,
    required: true,
  },
  follows: [{
    madeAt: Date,
    to: String,
  }],
  followsCounter: Number,
}, {
  timestamps: false,
  usePushEach: true,
})

// indexes
ListAccountFollowingsMadeModelSchema.index({
  from: 1,
  'follows.to': 1,
})

// Compile model from schema
mongoose.model('ListAccountFollowingsMade', ListAccountFollowingsMadeModelSchema)
