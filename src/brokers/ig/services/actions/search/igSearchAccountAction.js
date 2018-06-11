

// const Client = require('instagram-private-api').V1
const Client = require('./../../client')

const { FoundResponse } = rootRequire('./src/models')

const {
  igApiErrorHandler,
  igBuildSession,
  filterResponse,
  addHistoricEntry,
  igUpdateSession,
} = require('./../../utils')

/**
 * Register a new user
 */

module.exports = {
  params: {
    query: 'string',
    igAccount: {
      type: 'object',
      props: {
        igAccountId: 'string',
        cookies: 'array',
      },
    },
  },
  async handler(ctx) {
    const { query, igAccount } = ctx.params
    const { igAccountId } = ctx.params.igAccount

    addHistoricEntry(ctx, igAccount, 'searchAccount', { igId: igAccountId, query })

    const session = await igBuildSession(ctx, igAccount)

    const results = await Client.Account.search(session, query)

    // dont await
    igUpdateSession(ctx, igAccount, session)

    const allowedAttributes = ['igId', 'profilePicUrl', 'followerCount', 'fullName', 'username', 'isVerified']
    const accounts = results.map(r => filterResponse(r.getParams(), allowedAttributes))

    return new FoundResponse('accounts', { accounts })
  },
}
