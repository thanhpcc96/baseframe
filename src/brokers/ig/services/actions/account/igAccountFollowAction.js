

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

    // add follow made to list
    const addToListResult = await ctx.call('list.accounts.followsMade.addOrUpdate', { from: igAccount.igAccountId, to: targetAccount.igId })
    if (addToListResult.code !== 201) { throw new Error(addToListResult) }

    // made follow
    const session = await igBuildSession(ctx, igAccount)

    const response = await Client.Relationship.create(session, targetAccount.igId)

    await igUpdateSession(ctx, igAccount, session)
    return new OkResponse('response', { response })
  },
}
