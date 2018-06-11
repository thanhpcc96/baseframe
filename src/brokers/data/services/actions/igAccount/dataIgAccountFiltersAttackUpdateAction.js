

const mongoose = require('mongoose')
const { DateTime } = require('luxon')

const { MoleculerEntityNotFoundError } = rootRequire('./src/errors')
const { OkResponse } = rootRequire('./src/models')

module.exports = {
  params: {
    igAccountId: 'string',
    userId: 'string',
    privateAccounts: 'boolean',
    businessAccounts: 'boolean',
    notFollowers: 'boolean',
    moreThanOnce: 'boolean',
    timeBetweenAttacksSameAccount: 'number',
    full: {
      type: 'boolean',
      optional: true,
    },
  },
  async handler(ctx) {
    const {
      igAccountId,
      userId,
      privateAccounts,
      businessAccounts,
      notFollowers,
      moreThanOnce,
      timeBetweenAttacksSameAccount,
    } = ctx.params

    const full = !!ctx.params.full

    const InstagramAccount = mongoose.model('InstagramAccount')
    const igAccount = await InstagramAccount.findOne({ _id: igAccountId, owner: userId }).exec()

    if (!igAccount) { throw new MoleculerEntityNotFoundError('InstagramAccount') }

    igAccount.configuration.filters.attack.privateAccounts = privateAccounts
    igAccount.configuration.filters.attack.businessAccounts = businessAccounts
    igAccount.configuration.filters.attack.notFollowers = notFollowers
    igAccount.configuration.filters.attack.moreThanOnce = moreThanOnce
    igAccount.configuration.filters.attack.timeBetweenAttacksSameAccount = timeBetweenAttacksSameAccount
    await igAccount.save()

    await ctx.call('data.igAccount.notifyUpdated', {
      igAccountId,
      time: Date.now(),
    })

    return new OkResponse('igAccount', { igAccount: igAccount.toApi({ full }) })
  },
}

