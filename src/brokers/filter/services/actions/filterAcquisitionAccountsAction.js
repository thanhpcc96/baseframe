

const _ = require('lodash')
// const mongoose = require('mongoose')
const { DateTime } = require('luxon')

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
        ctx.broker.logger.error(`bad format - filterAcquisitionAccountsAction, account: ${JSON.stringify(a)}`)
        throw new Error('bad format')
      }
    })

    // -2. filter repeated accounts
    accounts = _.uniqWith(accounts, (arrVal, othVal) => arrVal.igId === othVal.igId)

    // -1. blacklist accounts
    const allBlacklistIds = igAccount.cycle.configuration.filters.attack.blacklist.map(a => ({ igId: a.igId }))
    accounts = accounts.filter(a => !allBlacklistIds.includes(a.igId))

    // debug
    /*
    console.log('filtering acquistion accounts! :')
    accounts.forEach((a) => {
      console.log('---- a  --->')
      console.log(a)
    })
    */

    // 0. filter our own account
    accounts = accounts.filter(a => igAccount.igAccountId !== a.igId)

    // 1. filter accounts we already follow
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
        ctx.broker.logger.error(`bad format - filterAcquisitionAccountsAction - friendshipStatus, account: ${JSON.stringify(a)}`)
        throw new Error('bad format on friendshipStatus')
      }

      // optional field - if already follow us
      if (a.friendshipStatus.followedBy === true) {
        return false
      }

      // obligatory field - already following him/her
      if (a.friendshipStatus.following === true) {
        return false
      }

      // obligatory field - outgoing request already made
      if (a.friendshipStatus.outgoingRequest === true) {
        return false
      }

      return true
    })

    // 2. privateAccounts
    if (igAccount.cycle.configuration.filters.attack.privateAccounts === false) {
      // TODO => review this!
      accounts = accounts.filter(a => a.isPrivate === false)

      // accounts = accounts.filter(a =>
      // maybe we dont have isPrivate, when? I think we always have isPrivate
      // if (_.isBoolean(a.isPrivate)) {
      // a.isPrivate === false,
      // }
      // return true
      // )
    }

    // 3. businessAccounts
    if (igAccount.cycle.configuration.filters.attack.businessAccounts === false) {
      // if we dont have isBusiness attribute, we consider the account is not bussiness
      accounts = accounts.filter(a => !_.isBoolean(a.isBusiness) || a.isBusiness === false)
    }

    // 4. filter account which follow us? howwww???
    // 5. notFollowers
    // ?????

    // 6. filter accounts already attacked
    const attackMoreThanOnce = igAccount.cycle.configuration.filters.attack.moreThanOnce
    const timeBetweenAttacksSameAccount = igAccount.cycle.configuration.filters.attack.timeBetweenAttacksSameAccount

    accounts = await Promise.all(accounts.map(async (a) => {
      const payload = {
        from: igAccount.igAccountId,
        to: a.igId,
      }

      if (attackMoreThanOnce === true) {
        payload.madeBeforeAt = DateTime.utc().minus({ milliseconds: timeBetweenAttacksSameAccount }).valueOf()
      } else {
        payload.madeBeforeAt = null
      }

      const resultsFound = await ctx.call('list.accounts.followsMade.findOne', payload)
      if (resultsFound.code === 404) {
        return a
      } else if (resultsFound.code === 200) {
        return null
      }
      throw new Error(resultsFound)
    }))
    accounts = accounts.filter(a => a !== null)

    // 7.filter accounts already follow us
    accounts = await Promise.all(accounts.map(async (a) => {
      const resultsFound = await ctx.call('list.accounts.followers.findOne', { from: a.igId, to: igAccount.igAccountId })
      if (resultsFound.code === 404) {
        return a
      } else if (resultsFound.code === 200) {
        return null
      }
      throw new Error(resultsFound)
    }))
    accounts = accounts.filter(a => a !== null)

    // all ok
    return new OkResponse('accounts', { accounts })
  },
}
