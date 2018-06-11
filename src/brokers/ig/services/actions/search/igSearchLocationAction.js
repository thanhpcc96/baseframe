

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

    addHistoricEntry(ctx, igAccount, 'searchLocation', { igId: igAccountId, query })

    const session = await igBuildSession(ctx, igAccount)

    const results = await Client.Location.search(session, query)

    // dont await
    igUpdateSession(ctx, igAccount, session)

    const allowedAttributes = ['igId', 'lng', 'lat', 'state', 'city', 'address', 'title', 'subtitle']
    const locations = results.map(r => filterResponse(r.params, allowedAttributes))
    return new FoundResponse('locations', { locations })
  },
}
