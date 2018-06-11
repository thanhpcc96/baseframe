

const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const _ = require('lodash')

const config = rootRequire('config')

const Schema = mongoose.Schema

// const
const SALT_WORK_FACTOR = 8

// Define schema

const SmartgramUserModelSchema = new Schema({
  firstName: String,
  lastName: String,

  instagramAccounts: [{
    type: Schema.Types.ObjectId,
    ref: 'InstagramAccount',
  }],

  audiencies: [{
    type: Schema.Types.ObjectId,
    ref: 'Audience',
  }],

  // email
  email: String,
  emailVerified: Boolean,
  verificationEmailCount: Number,
  tokenVerifyEmail: String,

  // login failed
  failedLoginCount: Number,
  lastFailedLoginAt: Date,
  lastFailedLoginIp: String,

  // pass
  password: String,

  // country - iso-3166-1
  country: { type: String, get: getCountryOrDefault },

  api: {
    refreshToken: String,
    autoLoginToken: String,
  },

  // this is written by config service
  isEnabled: {
    type: Boolean,
    default: config.data.enabledAccountDefault,
  },
  isLocked: {
    type: Boolean,
    default: false,
  },
  isBetaUser: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
  usePushEach: true,
})

/**
 * [getCountryOrDefault description]
 * @param  {[type]} country [description]
 * @return {[type]}         [description]
 */
function getCountryOrDefault(country) {
  return _.isEmpty(country) ? 'es' : country
}

/**
 * Auto password hash befose save
 * @param  {[type]} next) {             var user [description]
 * @return {[type]}       [description]
 */
SmartgramUserModelSchema.pre('save', function presave(next) {
  const self = this
  if (!self.isModified('password')) return next()
  bcrypt.genSalt(SALT_WORK_FACTOR, (err, salt) => {
    if (err) return next(err)
    bcrypt.hash(self.password, salt, (err, hash) => {
      if (err) return next(err)
      self.password = hash
      next()
    })
  })
})

/**
 * [comparePassword description]
 * @param  {[type]}   candidatePassword [description]
 * @param  {Function} cb                [description]
 * @return {[type]}                     [description]
 */
SmartgramUserModelSchema.methods.comparePassword = function comparePassword(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password)
}

SmartgramUserModelSchema.methods.toApi = function toApi(options = { full: false }) {
  const thisJSON = this.toJSON()

  const data = {
    id: thisJSON._id,
    firstName: thisJSON.firstName,
    lastName: thisJSON.lastName,
    email: thisJSON.email,
    emailVerified: !!thisJSON.emailVerified,
    isEnabled: !!thisJSON.isEnabled,
    isBetaUser: !!thisJSON.isBetaUser,
    api: {
      refreshToken: thisJSON.api.refreshToken,
    },
    country: _.isEmpty(thisJSON.country) ? null : thisJSON.country,
  }

  // figures
  if (this.populated('instagramAccounts') && this.populated('audiencies')) {
    data.figures = {
      igAccounts: {
        online: thisJSON.instagramAccounts.filter(a => ['fetching', 'ready', 'challengedRequired', 'sentryBlock', 'loginRequired'].includes(a.status)).length,
        offlile: thisJSON.instagramAccounts.filter(a => ['removed'].includes(a.status)).length,
      },
      audiencies: thisJSON.audiencies.length,
    }
  } else {
    data.figures = {}
  }

  // full
  if (options.full) {
    // future user attributes
  }

  return data
}

// indexes
SmartgramUserModelSchema.index({
  email: 1,
})

// Compile model from schema
mongoose.model('SmartgramUser', SmartgramUserModelSchema)
