
const _ = require('lodash')

// const Client = require('instagram-private-api').V1
const Client = require('./../../client')

const { FoundResponse } = rootRequire('./src/models')

const {
  igApiErrorHandler,
  igBuildSession,
  addHistoricEntry,
  igUpdateSession,
} = require('./../../utils')

/**
 * Register a new user
 */

module.exports = {
  params: {
    accountId: 'string',
    accountUsername: 'string',
    igAccount: {
      type: 'object',
      props: {
        igAccountId: 'string',
        cookies: 'array',
      },
    },
  },
  async handler(ctx) {
    const { igAccount, accountId, accountUsername } = ctx.params

    await addHistoricEntry(ctx, igAccount, 'getAnotherAccount', { igId: accountId, username: accountUsername })

    // build session
    const session = await igBuildSession(ctx, igAccount)

    // get account and friendship
    const results = await Promise.all([
      Client.Account.getById(session, accountId),
      Client.Relationship.get(session, accountId),
    ])

    const account = results[0].getParams()
    account.friendshipStatus = results[1].getParams()

    // if account is not private. get stories and firsts feed medias (like the real app)
    if (account.isPrivate === false) {
      // get stories info (like real app but ingore them)
    // get user media feed (like real app but ignore them)
      await (new Client.Feed.UserMedia(session, accountId)).get
      await Client.Story.getByUserId(session, accountId)
    }

    // store new session
    await igUpdateSession(ctx, igAccount, session)

    // all ok
    return new FoundResponse('account', { account })
  },
}
