

const _ = require('lodash')
const mongoose = require('mongoose')

const Schema = mongoose.Schema

// Define schema
const AudienceModelSchema = new Schema({
  name: String,
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'SmartgramUser',
    required: true,
  },
  locations: [{
    igId: String,
    title: String,
    subtitle: String,
    address: String,
    lat: Number,
    lng: Number,
    city: String,
    state: String,
  }],
  hashtags: [{
    igId: String,
    name: String,
    mediaCount: String,
  }],
  accounts: [{
    igId: String,
    fullName: String,
    username: String,
    profilePicUrl: String,
    followerCount: Number,
  }],
}, {
  timestamps: true,
  usePushEach: true,
})

/**
 * [description]
 * @param  {[type]} next) {             } [description]
 * @return {[type]}       [description]
 */
AudienceModelSchema.pre('save', function (next) {
  if (!_.isEmpty(this.name) && this.name.length > 1) {
    this.name = this.name.charAt(0).toUpperCase() + this.name.slice(1)
  }

  next()
})

/**
 * [empty description]
 * @return {[type]} [description]
 */
AudienceModelSchema.methods.empty = function empty() {
  const data = this.toJSON()

  return data.locations.length <= 0 &&
    data.hashtags.length <= 0 &&
    data.accounts.length <= 0
}

/**
 * [getConfiguration description]
 * @return {[type]} [description]
 */
AudienceModelSchema.methods.getConfiguration = function getConfiguration() {
  return {
    locations: this.locations.map(l => ({
      igId: l.igId,
      title: l.title,
    })),
    hashtags: this.hashtags.map(h => ({
      igId: h.igId,
      name: h.name,
    })),
    accounts: this.accounts.map(a => ({
      igId: a.igId,
      username: a.username,
    })),
  }
}

/**
 * [toApi description]
 * @return {[type]} [description]
 */
AudienceModelSchema.methods.toApi = function toApi(options = { less: false, full: false }) {
  const thisJSON = this.toJSON()

  // less
  if (options.less === true) {
    return {
      id: thisJSON._id,
      name: thisJSON.name,
    }
  }

  // normal
  return {
    id: thisJSON._id,
    name: thisJSON.name,
    locations: thisJSON.locations.map(l => ({
      igId: l.igId,
      title: _.isEmpty(l.title) ? null : l.title,
      subtitle: _.isEmpty(l.subtitle) ? null : l.subtitle,
      lat: l.lat,
      lng: l.lng,
    })),
    hashtags: thisJSON.hashtags.map(h => ({
      igId: h.igId,
      name: _.isEmpty(h.name) ? null : h.name,
      mediaCount: h.mediaCount && h.mediaCount > 0 ? h.mediaCount : null,
    })),
    accounts: thisJSON.accounts.map(a => ({
      igId: a.igId,
      fullName: _.isEmpty(a.fullName) ? null : a.fullName,
      username: a.username,
      profilePicUrl: a.profilePicUrl ? a.profilePicUrl : null,
      followerCount: a.followerCount ? a.followerCount : null,
    })),
  }
}

/**
 * [toMircroservice description]
 * @return {[type]} [description]
 */
AudienceModelSchema.methods.toMircroservice = function toMircroservice() {
  return this.toJSON()
}

// indexes
AudienceModelSchema.index({
  owner: 1,
})

// Compile model from schema
mongoose.model('Audience', AudienceModelSchema)
