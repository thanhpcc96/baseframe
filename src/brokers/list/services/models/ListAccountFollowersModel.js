

const mongoose = require('mongoose')

// Define schema
const Schema = mongoose.Schema

const ListAccountFollowersModelSchema = new Schema({
  to: {
    type: String,
    required: true,
  },
  follows: [String],
  followsCounter: Number,
}, {
  timestamps: false,
  usePushEach: true,
})

// indexes
ListAccountFollowersModelSchema.index({
  to: 1,
  'follows.from': 1,
})

// Compile model from schema
mongoose.model('ListAccountFollowers', ListAccountFollowersModelSchema)
