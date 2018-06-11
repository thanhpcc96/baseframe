

const moment = require('moment')
const mongoose = require('mongoose')
const { DateTime, Duration, Interval } = require('luxon')
const _ = require('lodash')

const DataInstagramAccountChallengeSchema = require('./DataInstagramAccountChallengeSchema')

// Define schema
const Schema = mongoose.Schema

const InstagramAccountModelSchema = new Schema({
  igAccountId: {
    type: String,
    required: true,
  },
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'SmartgramUser',
    required: true,
  },
  status: {
    type: String,
    enum: ['fetching', 'ready', 'challengedRequired', 'sentryBlock', 'loginRequired', 'removed'],
    required: true,
  },
  activity: {
    type: String,
    enum: ['stopping', 'starting', 'stopped', 'started'],
    required: true,
    default: 'stopped',
  },
  time: {
    type: Number,
    default: moment.duration(7, 'days').asMilliseconds(), // 7 days on milliseconds
  },

  notifications: [{
    createdAt: { type: Date, default: DateTime.utc().toJSDate() },
    type: { type: String, enum: ['internalError', 'thereIsNoMoreTime', 'restartToApplyChanges', 'noMoreActionsToDo'] },
    payload: {},
  }],

  // ig account info
  lastSynchronizedAt: Date,

  username: String,
  fullName: String,
  isPrivate: Boolean,
  profilePicUrl: String,
  isVerified: Boolean,
  mediaCount: Number,
  geoMediaCount: Number,
  followerCount: Number,
  followingCount: Number,
  biography: String,
  externalUrl: String,
  isBusiness: Boolean,
  category: String,

  // current cycle
  cycle: {
    startedAt: Date,
    stoppedAt: Date,
  },

  // configuration
  configuration: {
    actions: {
      likes: { type: Boolean, default: true },
      comments: { type: Boolean, default: true },
      follows: { type: Boolean, default: true },
      unfollows: { type: Boolean, default: true },
    },
    speed: { type: Number, default: 0 },
    sources: {
      attack: { type: String, enum: ['all', 'feed', 'audience'], default: 'feed' },
      unattack: { type: String, enum: ['all', 'smartgram'], default: 'all' },
    },
    audience: { type: Schema.Types.ObjectId, ref: 'Audience' },
    cycleSize: {
      automatic: { type: Boolean, default: true },
      follow: { type: Number, default: 500 },
      unfollow: { type: Number, default: 600 },
    },
    filters: {
      attack: {
        privateAccounts: { type: Boolean, default: false },
        businessAccounts: { type: Boolean, default: true },
        notFollowers: { type: Boolean, default: true },
        moreThanOnce: { type: Boolean, default: true },
        timeBetweenAttacksSameAccount: { type: Number, default: Duration.fromObject({ days: 5 }).as('milliseconds') }, // 5 days on millisecods
        blacklist: [{
          igId: String, fullName: String, username: String, profilePicUrl: String, followerCount: Number,
        }],
      },
      unattack: {
        whoDontFollowMe: { type: Boolean, default: true },
      },
      media: {
        age: { type: Number, default: Duration.fromObject({ days: 7 }).as('milliseconds') }, // 1 week on milliseconds
      },
    },
  },

  // challenge info
  challenge: DataInstagramAccountChallengeSchema,

}, {
  timestamps: true,
  usePushEach: true,
})

/**
 * [description]
 * @param  {[type]} next) {             if (this.isModified('activity') && 'stopped' [description]
 * @return {[type]}       [description]
 */
InstagramAccountModelSchema.pre('save', function save(next) {
  if (this.isModified('activity') && this.activity === 'stopped') {
    const cycleStartedAt = DateTime.fromJSDate(this.cycle.startedAt).toUTC()
    const now = DateTime.utc()
    const duration = Interval.fromDateTimes(cycleStartedAt, now).toDuration()

    const newTime = Math.round(this.time - duration.as('milliseconds'))
    this.time = newTime > 0 ? newTime : 0
  }

  next()
})

/**
 * [save description]
 * @param  {[type]} next) {             if (this.toJSON().configuration.cycleSize.automatic [description]
 * @return {[type]}       [description]
 */
InstagramAccountModelSchema.pre('save', function save(next) {
  if (this.toJSON().configuration.cycleSize.automatic === true) {
    this.configuration.cycleSize.follow = this.getCycleSize()
    this.configuration.cycleSize.unfollow = this.getCycleSize() + 100
  }
  next()
})

InstagramAccountModelSchema.methods.isConfigurationReady = function isConfigurationReady() {
  const thisJSON = this.toJSON()
  const neededAudience = ['all', 'audience'].includes(thisJSON.configuration.sources.attack)

  if (neededAudience) {
    const isAudienceEmpty = _.isEmpty(thisJSON.configuration.audience) ||
      (_.isEmpty(thisJSON.configuration.audience.locations) &&
        _.isEmpty(thisJSON.configuration.audience.accounts) &&
        _.isEmpty(thisJSON.configuration.audience.hashtags))

    if (isAudienceEmpty) {
      return false
    }
  }

  return true
}

/**
 * [isActivityStarted description]
 * @return {Boolean} [description]
 */
InstagramAccountModelSchema.methods.isActivityStarted = function isActivityStarted() {
  return this.activity === 'started' || this.activity === 'starting'
}

/**
 * [isActivityStopped description]
 * @return {Boolean} [description]
 */
InstagramAccountModelSchema.methods.isActivityStopped = function isActivityStopped() {
  return this.activity === 'stopped' || this.activity === 'stopping'
}

/**
 * [getTimeUsed description]
 * @return {[type]} [description]
 */
InstagramAccountModelSchema.methods.getTimeUsed = function getTimeUsed() {
  let timeUsed = 0

  if (this.isActivityStarted()) {
    const cycleStartedAt = DateTime.fromJSDate(this.cycle.startedAt).toUTC()
    const now = DateTime.utc()
    const interval = Interval.fromDateTimes(cycleStartedAt, now)
    const duration = interval.toDuration()

    timeUsed = duration.as('milliseconds')
    timeUsed = Math.round(timeUsed)
  }

  return timeUsed
}

/**
 * [getTimeLeft description]
 * @return {[type]} [description]
 */
InstagramAccountModelSchema.methods.getTimeLeft = function getTimeLeft() {
  let timeLeft = 0

  if (this.isActivityStopped()) {
    timeLeft = this.time
  } else if (this.isActivityStarted()) {
    const timeUsed = this.getTimeUsed()
    timeLeft = this.time - timeUsed
  } else {
    throw new Error('Invalid activity')
  }

  // time is in milliseconds so not return less than one second
  return timeLeft >= 1000 ? timeLeft : 0
}

/**
 * [getCycleSize description]
 * @return {[type]} [description]
 */
InstagramAccountModelSchema.methods.getCycleSize = function getCycleSize() {
  let size = Math.round(this.toJSON().followerCount / 2 / 100) * 100
  if (size > 3000) size = 3000
  if (size < 100) size = 100
  return size
}

/**
 * [isAudienceNeeded description]
 * @return {Boolean} [description]
 */
InstagramAccountModelSchema.methods.isAudienceNeeded = function isAudienceNeeded() {
  return ['all', 'audience'].indexOf(this.toJSON().configuration.sources.attack) >= 0
}

/**
 * [getConfiguration description]
 * @return {[type]} [description]
 */
InstagramAccountModelSchema.methods.getConfiguration = function getConfiguration() {
  const thisJSON = this.toJSON()
  const configurationToReturn = {}

  // sources
  configurationToReturn.sources = {
    attack: thisJSON.configuration.sources.attack,
    unattack: thisJSON.configuration.sources.unattack,
  }

  // audience
  configurationToReturn.audience = this.populated('configuration.audience') ? this.configuration.audience.getConfiguration() : null

  // actions
  configurationToReturn.actions = {
    likes: thisJSON.configuration.actions.likes,
    follows: thisJSON.configuration.actions.follows,
    unfollows: thisJSON.configuration.actions.unfollows,
    comments: thisJSON.configuration.actions.comments,
  }

  // speed
  configurationToReturn.speed = thisJSON.configuration.speed

  // batch sizes
  configurationToReturn.cycleSize = {
    attack: thisJSON.configuration.cycleSize.follow,
    unattack: thisJSON.configuration.cycleSize.unfollow,
  }

  // filters
  configurationToReturn.filters = {
    attack: {
      privateAccounts: !!thisJSON.configuration.filters.attack.privateAccounts,
      businessAccounts: !!thisJSON.configuration.filters.attack.businessAccounts,
      notFollowers: !!thisJSON.configuration.filters.attack.notFollowers,
      moreThanOnce: !!thisJSON.configuration.filters.attack.moreThanOnce,
      timeBetweenAttacksSameAccount: thisJSON.configuration.filters.attack.timeBetweenAttacksSameAccount,
      blacklist: thisJSON.configuration.filters.attack.blacklist.map(a => ({ igId: a.igId })),
    },
    unattack: {
      whoDontFollowMe: !!thisJSON.configuration.filters.unattack.whoDontFollowMe,
    },
    media: {
      age: thisJSON.configuration.filters.media.age,
    },
  }

  // country
  configurationToReturn.country = this.populated('owner') ? this.owner.country : null

  return configurationToReturn
}

/**
 * [toApi description]
 * @param  {Boolean} allAttributes [description]
 * @return {[type]}                [description]
 */
InstagramAccountModelSchema.methods.toApi = function toApi(options = { full: false, less: false }) {
  const thisJSON = this.toJSON()

  let data = {
    id: thisJSON._id,
    igAccountId: thisJSON.igAccountId,
    username: _.isEmpty(thisJSON.username) ? thisJSON.igAccountId : thisJSON.username,
    status: thisJSON.status,
  }

  // if less option return here!
  if (options.less === true) {
    return data
  }

  // normal
  data = _.merge(data, {
    timeLeft: this.getTimeLeft(),
    fullName: thisJSON.fullName || '',
    profilePicUrl: thisJSON.profilePicUrl || '',
    followerCount: thisJSON.followerCount || 0,
    followingCount: thisJSON.followingCount || 0,
    mediaCount: thisJSON.mediaCount || 0,
    category: thisJSON.category || '',
    activity: thisJSON.activity,
    lastUpdatedAt: thisJSON.lastSynchronizedAt,
    cycle: {
      startedAt: thisJSON.cycle && thisJSON.cycle.startedAt ? DateTime.fromJSDate(thisJSON.cycle.startedAt).toUTC() : null,
      stoppedAt: thisJSON.cycle && thisJSON.cycle.stoppedAt ? DateTime.fromJSDate(thisJSON.cycle.stoppedAt).toUTC() : null,
      timeUsed: this.getTimeUsed(),
    },
    notifications: thisJSON.notifications.map(n => ({
      id: n._id.toString(),
      createdAt: n.createdAt,
      type: n.type,
      payload: n.payload || null,
    })),
  })

  // full
  if (options.full === true) {
    let audience = ''
    if (thisJSON.configuration.audience) {
      if (thisJSON.configuration.audience._id) {
        audience = thisJSON.configuration.audience._id.toString()
      } else {
        audience = thisJSON.configuration.audience.toString()
      }
    }

    data = _.merge(data, {
      externalUrl: thisJSON.externalUrl || '',
      biography: thisJSON.biography || '',
      isBusiness: !!thisJSON.isBusiness,
      isVerified: !!thisJSON.isVerified,
      isPrivate: !!thisJSON.isPrivate,

      // configuration
      configuration: {
        actions: {
          likes: !!thisJSON.configuration.actions.likes,
          comments: !!thisJSON.configuration.actions.comments,
          follows: !!thisJSON.configuration.actions.follows,
          unfollows: !!thisJSON.configuration.actions.unfollows,
        },
        speed: _.isNumber(thisJSON.configuration.speed) ? thisJSON.configuration.speed : 0,
        sources: {
          attack: thisJSON.configuration.sources.attack,
          unattack: thisJSON.configuration.sources.unattack,
        },
        audience,
        cycleSize: {
          automatic: !!thisJSON.configuration.cycleSize.automatic,
          follow: thisJSON.configuration.cycleSize.follow ? thisJSON.configuration.cycleSize.follow : 500,
          unfollow: thisJSON.configuration.cycleSize.unfollow ? thisJSON.configuration.cycleSize.unfollow : 600,
        },
        filters: {
          attack: {
            privateAccounts: !!thisJSON.configuration.filters.attack.privateAccounts,
            businessAccounts: !!thisJSON.configuration.filters.attack.businessAccounts,
            notFollowers: !!thisJSON.configuration.filters.attack.notFollowers,
            moreThanOnce: !!thisJSON.configuration.filters.attack.moreThanOnce,
            timeBetweenAttacksSameAccount: thisJSON.configuration.filters.attack.timeBetweenAttacksSameAccount,
            blacklist: thisJSON.configuration.filters.attack.blacklist.map(a => ({
              igId: a.igId, fullName: a.fullName, username: a.username, profilePicUrl: a.profilePicUrl, followerCount: a.followerCount,
            })),
          },
          unattack: {
            whoDontFollowMe: !!thisJSON.configuration.filters.unattack.whoDontFollowMe,
          },
          media: {
            age: thisJSON.configuration.filters.media.age,
          },
        },
      },
    })
  }

  // challenge
  if (options.full === true) {
    // data = _.merge(data, { challenge: this.populated('challenge') ? this.challenge.toApi() : {} })
    data = _.merge(data, { challenge: this.challenge ? this.challenge.toApi() : {} })
  }

  return data
}

/*
InstagramAccountModelSchema.methods.toMircroservice = function () {
  return this.toJSON();
};
*/

/*
//virtual attributes
InstagramAccountModelSchema.virtual('cycle.timeUsed')
  .get(function () {
    let startedAt = moment(this.cycle.startedAt);
    if (startedAt.isValid()) {
      return moment().utc().diff(startedAt, 'seconds');
    }

    return 0;
  });
*/

// indexes
InstagramAccountModelSchema.index({
  igAccountId: 1,
  owner: 1,
  'configuration.audience': 1,
})

// Compile model from schema
mongoose.model('InstagramAccount', InstagramAccountModelSchema)
