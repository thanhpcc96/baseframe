

const _ = require('lodash')

// const Client = require('instagram-private-api').V1
const Client = require('./../../client')

const utils = rootRequire('./src/utils')
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
    targetAccount: {
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
    const { igAccount, targetAccount } = ctx.params

    // made follow
    const session = await igBuildSession(ctx, igAccount)

    const response = await Client.Relationship.destroy(session, targetAccount.igId)

    await igUpdateSession(ctx, igAccount, session)
    return new OkResponse('response', { response })
  },
}
