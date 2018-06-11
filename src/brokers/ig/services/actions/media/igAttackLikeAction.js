

// const Client = require('instagram-private-api').V1
const Client = require('./../../client')

const { OkResponse } = rootRequire('./src/models')

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
    media: {
      type: 'object',
      props: {
        igId: 'string',
      },
    },
    igAccount: {
      type: 'object',
      props: {
        igAccountId: 'string',
        cookies: 'array',
      },
    },
  },
  async handler(ctx) {
    const { igAccount, media } = ctx.params

    const session = await igBuildSession(ctx, igAccount)

    await Client.Like.create(session, media.igId)

    await igUpdateSession(ctx, igAccount, session)

    return new OkResponse()
  },
}
