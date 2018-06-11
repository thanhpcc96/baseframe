
const _ = require('lodash')

// const Client = rootRequire('src/brokers/ig/igClient').V1
// const Client = require('instagram-private-api').V1

const { FoundResponse } = rootRequire('./src/models')


const {
  igApiErrorHandler,
  igBuildSession,
  igUpdateSession,
} = require('./../../utils')

/**
 * Register a new user
 */

module.exports = {
  params: {
    feedId: 'string',
    cursor: { type: 'string', optional: true },
    igAccount: {
      type: 'object',
      props: {
        igAccountId: 'string',
        cookies: 'array',
      },
    },
  },
  handler() {
    throw new Error('handler not implemented')
  },
  async iterateFeed(ctx, FeedConstructor, type) {
    const types = ['medias', 'accounts']
    const { cursor, igAccount, feedId } = ctx.params

    if (types.indexOf(type) < 0) {
      throw new Error(`type not valid, type:${type}`)
    }

    // build session and feed then iterate
    const session = await igBuildSession(ctx, igAccount)
    const feed = new FeedConstructor(session, feedId)

    if (!_.isEmpty(cursor)) {
      feed.setCursor(cursor)
    }

    // make feed request!
    const response = await feed.get()

    let accounts = []
    let medias = []

    if (type === 'accounts') {
      // accounts type!
      accounts = response.map(r => r.getParams())

      // get friendship info and set to every user..
      const relationshipsResponse = await ctx.call('ig.relationship.getMany', { igAccount, igAccountIdsTarget: accounts.map(a => a.igId) })
      if (relationshipsResponse.code !== 200) throw relationshipsResponse

      accounts.forEach((a) => {
        a.friendshipStatus = _.find(relationshipsResponse.data[relationshipsResponse.type], r => r.igAccountId === a.igId) || null
      })

      // check all process ok
      accounts.forEach((a) => {
        if (_.isEmpty(a.friendshipStatus)) {
          throw new Error('some os the users doesnt have fiendsship info')
        }
      })
    } else if (type === 'medias') {
      // medias type!
      medias = response.map(r => r.getParams())
    } else {
      throw new Error(`invalid type, type:${type}`)
    }

    await igUpdateSession(ctx, igAccount, session)

    const data = {
      cursor: _.isEmpty(feed.getCursor()) ? null : feed.getCursor(),
      moreAvailable: feed.isMoreAvailable(),
      accounts: _.isEmpty(accounts) ? undefined : accounts,
      medias: _.isEmpty(medias) ? undefined : medias,
      type,
    }

    return new FoundResponse('feed', data)
  },

}

