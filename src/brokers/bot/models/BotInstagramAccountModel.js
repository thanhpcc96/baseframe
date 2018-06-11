

const mongoose = require('mongoose')
// let _ = require('lodash');
const { DateTime } = require('luxon')

const botInstagramAccountModelQueueCompiler = require('./botInstagramAccountModelQueueCompiler')

// Define schema
const Schema = mongoose.Schema

const InstagramAccountModelSchema = new Schema({
  // shared info
  igAccountId: {
    type: String,
    required: true,
  },

  /*
  owner: {
    type: Schema.Types.ObjectId,
    required: true,
  },
  */

  // current status, username, session cookies <-> instagram
  /*
  synchronized: {
    type: Boolean,
    default: false,
  },
  */

  // why is the username here???????
  // reason 1. => using this to generate the device info
  username: {
    type: String,
    required: false,
  },

  cookies: [{
    _id: false,
    key: String,
    value: String,
    expires: Date,
    maxAge: Number,
    domain: String,
    path: String,
    secure: Boolean,
    hostOnly: Boolean,
    creation: Date,
    lastAccessed: Date,
  }],

  // global workflow
  state: {
    type: String,
    enum: ['stopped', 'started'],
    required: true,
    default: 'stopped',
  },

  // shared all workflows
  tickLocked: {
    type: Boolean,
    default: false,
  },
  unlockedAt: {
    type: Date,
    default: DateTime.utc(),
  },
  lockedAt: {
    type: Date,
    default: null,
  },

  // cycle workflow
  cycle: {

    // debug purpose
    startedAt: Date,

    // debug purpose
    state: {
      type: String,
      default: 'init',
    },

    // followers control
    followersUpdatedAt: Date,

    // ready
    ready: {
      attack: {
        accounts: [{ }],
        medias: [{ }],
      },
      unattack: {
        accounts: [{
          username: { type: String },
          igAccountId: { type: String },
        }],
      },
    },

    // counters
    counters: {
      // cycle
      attacksTotal: { type: Number, default: 0 },
      unattacksTotal: { type: Number, default: 0 },

      // step
      attacksOnStep: { type: Number, default: 0 },
      unattacksOnStep: { type: Number, default: 0 },

      // pointer last attack source
      lastAudienceSource: { type: String, enum: ['accounts', 'hashtags', 'locations'] },
    },

    // decisions
    decisions: {
      // attackSource
      attackSource: {
        epsilon: Number,
        arms: [{
          name: String,
          value: Number,
          count: Number,
        }],
      },
    },

    // configuration
    configuration: {
      calculated: {
        attacksInRow: Number,
        unattacksInRow: Number,
      },
      audience: {
        accounts: [{
          _id: false,
          igId: String,
          username: String,
          used: Boolean,
        }],
        hashtags: [{
          _id: false,
          igId: String,
          name: String,
          used: Boolean,
        }],
        locations: [{
          _id: false,
          igId: String,
          title: String,
          used: Boolean,
        }],
      },
      actions: {
        comments: Boolean,
        unfollows: Boolean,
        follows: Boolean,
        likes: Boolean,
      },
      speed: Number,
      country: String,
      cycleSize: {
        attack: Number,
        unattack: Number,
      },
      sources: {
        attack: String,
        unattack: String,
      },
      filters: {
        attack: {
          privateAccounts: Boolean,
          businessAccounts: Boolean,
          notFollowers: Boolean,
          moreThanOnce: Boolean,
          timeBetweenAttacksSameAccount: Number,
        },
        unattack: {
          whoDontFollowMe: Boolean,
        },
        media: {
          age: Number,
        },
      },
    },
  },

  // queues
  queues: {
    management: [botInstagramAccountModelQueueCompiler('management')],
    control: [botInstagramAccountModelQueueCompiler('control')],
    cycle: [botInstagramAccountModelQueueCompiler('cycle')],
  },

  // error
  error: {
    type: Schema.Types.Mixed,
    default: null,
  },

}, {
  timestamps: true,
  usePushEach: true,
})

InstagramAccountModelSchema.methods.isWorking = () => this.toJSON().state === 'cycle'

InstagramAccountModelSchema.methods.toApi = function () {
  const data = this.toJSON()
  data.id = this._id.toString()

  delete data._id
  delete data.__v

  return data
}

// indexes
InstagramAccountModelSchema.index({
  igAccountId: 1,
})

// Compile model from schema
mongoose.model('InstagramAccount', InstagramAccountModelSchema)
