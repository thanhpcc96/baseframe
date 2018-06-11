

const mongoose = require('mongoose')

// Define schema
const Schema = mongoose.Schema

const settingModelSchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  value: Schema.Types.Mixed,
}, {
  timestamps: false,
  usePushEach: true,
})

// indexes
settingModelSchema.index({
  name: 1,
})

// toAtpi helper
settingModelSchema.methods.toApi = function () {
  const thisJSON = this.toJSON()

  return {
    name: thisJSON.name,
    value: thisJSON.value,
  }
}

// Compile model from schema
mongoose.model('Setting', settingModelSchema)
