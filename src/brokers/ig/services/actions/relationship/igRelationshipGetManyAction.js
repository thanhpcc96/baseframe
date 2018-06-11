
const _ = require('lodash')

// const Client = require('instagram-private-api').V1
const Client = require('./../../client')

const { OkResponse } = rootRequire('./src/models')

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
    igAccountIdsTarget: 'array',
    igAccount: {
      type: 'object',
      props: {
        igAccountId: 'string',
        cookies: 'array',
      },
    },
  },
  async handler(ctx) {
    const { igAccountIdsTarget, igAccount } = ctx.params

    if (!_.isArray(igAccountIdsTarget) || _.isEmpty(igAccountIdsTarget)) {
      throw new Error('There is not targets')
    }

    const session = await igBuildSession(ctx, igAccount)

    const relationships = await Client.Relationship.getMany(session, igAccountIdsTarget)

    await igUpdateSession(ctx, igAccount, session)

    return new OkResponse('relationships', { relationships: relationships.map(r => r.getParams()) })
  },
}
