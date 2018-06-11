

const mongoose = require('mongoose')
const _ = require('lodash')

// Define schema
const Schema = mongoose.Schema

const InstagramAccountChallengeSchema = new Schema({
  // our
  createdAt: Date,
  updatedAt: Date,
  auth: {
    username: String,
    password: String,
  },
  // responsed by ig
  session: {
    deviceSeed: String,
    cookies: [],
  },
  checkpointError: {
    url: String,
    apiPath: String,
    hideWebviewHeader: Boolean,
    lock: Boolean,
    logout: Boolean,
    nativeFlow: Boolean,
  },
  json: {
    stepName: String,
    stepData: {
      phoneNumber: String,
    },
    igAccountId: String,
    nonceCode: String,
    status: String,
  },
  resolved: Boolean,
}, {
  timestamps: false,
  usePushEach: true,
  _id: false,
})

InstagramAccountChallengeSchema.methods.toApi = function toApi() {
  const thisJSON = this.toJSON()

  return {
    resolved: !!thisJSON.resolved,
    step: _.get(thisJSON, 'json.stepName'),
    data: {
      phoneNumber: _.get(thisJSON, 'json.stepData.phoneNumber'),
    },
  }
}

module.exports = InstagramAccountChallengeSchema
