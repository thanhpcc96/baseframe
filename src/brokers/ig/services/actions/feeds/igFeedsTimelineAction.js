
const _ = require('lodash')

// const Client = require('instagram-private-api').V1
const Client = require('./../../client')

const igFeedsBase = require('./igFeedsBase')

/**
 * Register a new user
 */

const action = _.defaultsDeep({}, igFeedsBase)

action.handler = (ctx) => {
  const FeedConstructor = Client.Feed.Timeline
  const type = 'medias'
  return action.iterateFeed(ctx, FeedConstructor, type)
}

module.exports = action
