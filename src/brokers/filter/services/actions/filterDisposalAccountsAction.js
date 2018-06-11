

const moment = require('moment')
const _ = require('lodash')
const mongoose = require('mongoose')

const utils = rootRequire('./src/utils')
const { MoleculerConflictDataError } = rootRequire('./src/errors')
const { CreatedResponse } = rootRequire('./src/models')
const { OkResponse } = rootRequire('./src/models')

/**
 * Register a new user
 */

module.exports = {
  params: {
    accounts: { type: 'array' },
    igAccount: {
      type: 'object',
      props: {
        igAccountId: 'string',
        cookies: 'array',
      },
    },
  },
  async handler(ctx) {
    const { igAccount } = ctx.params
    let { accounts } = ctx.params

    // format
    accounts = _.castArray(accounts)

    // -0. check
    accounts.forEach((a) => {
      if (_.isEmpty(a) || !_.isString(a.igId) || _.isEmpty(a.igId) || _.isEmpty(a.username) || !_.isBoolean(a.isPrivate)) {
        ctx.broker.logger.error(`bad format - filterDisposalAccountsAction, account: ${JSON.stringify(a)}`)
        throw new Error('bad format')
      }
    })

    // -1. filter repeated accounts
    accounts = _.uniqWith(accounts, (arrVal, othVal) => arrVal.igId === othVal.igId)

    // -2. filter source of following
    const VALID_SOURCES = ['all', 'smartgram']
    const source = igAccount.cycle.configuration.sources.unattack
    if (!VALID_SOURCES.includes(source)) { throw new Error(`filterDisposalAccountsAction - unattack source not valid, source: ${source}`) }

    if (source === 'smartgram') {
      accounts = await Promise.all(accounts.map(async (a) => {
        const resultFind = await ctx.call('list.accounts.followsMade.find', { from: igAccount.igAccountId, to: a })
        if (resultFind.code === 200) {
          return a
        } else if (resultFind.code === 404) {
          return null
        }
        throw new Error(resultFind)
      }))
      accounts = accounts.filter(a => a !== null)
    }

    // -3. check filter -> unfollow who dont follow me
    const unattackWhoDontFollowMe = igAccount.cycle.configuration.filters.unattack.whoDontFollowMe
    if (!_.isBoolean(unattackWhoDontFollowMe)) { throw new Error(`unattackWhoDontFollowMe not valid, unattackWhoDontFollowMe: ${unattackWhoDontFollowMe}`) }

    accounts = accounts.filter((a) => {
      if (_.isEmpty(a.friendshipStatus)) {
        // we dont have info about friendship, maybe it's:
        // 1. array media's likers
        // 2. iterating some medias feed (no iteratin acconts feed (followers, followings))
        return true
      }

      // friendship status exists
      // 1. check format =>
      //  obligatory fields (following, outgoingRequest, isBestie). REMEMBER => we added igAccountId field!
      //  optional fields: (followedBy, blocking, isPrivate, incomingRequest)
      if (_.isEmpty(a.friendshipStatus.igAccountId) || !_.isBoolean(a.friendshipStatus.following) || !_.isBoolean(a.friendshipStatus.outgoingRequest) || !_.isBoolean(a.friendshipStatus.isBestie)) {
        ctx.broker.logger.error(`bad format - filterDisposalAccountsAction - friendshipStatus, account: ${JSON.stringify(a)}`)
        throw new Error('bad format on friendshipStatus')
      }

      // OPTIONAL field - if already follow us
      if (unattackWhoDontFollowMe === false) {
        if (a.friendshipStatus.followedBy === false) {
          return false
        }
      }

      // MANDATORY - this is strange.
      // when you follow nobody the ig api return some fake following.
      // so we have to remote all the accounts we dont follow here!
      if (a.friendshipStatus.following === false) {
        return false
      }

      return true
    })

    // all ok
    return new OkResponse('accounts', { accounts })
  },
}
