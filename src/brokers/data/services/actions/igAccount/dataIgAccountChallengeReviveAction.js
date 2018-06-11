
const _ = require('lodash')
const mongoose = require('mongoose')

const { OkResponse } = rootRequire('./src/models')
const { MoleculerConflictDataError, MoleculerInternalError, MoleculerEntityNotFoundError } = rootRequire('./src/errors')

// main handler
module.exports = {
  params: {
    igAccountId: 'string',
    full: { type: 'boolean', optional: true },
  },
  async handler(ctx) {
    const { igAccountId } = ctx.params
    const full = !!ctx.params.full

    const InstagramAccount = mongoose.model('InstagramAccount')

    // 1 - update igAccount
    const igAccount = await InstagramAccount.findOne({ _id: igAccountId }).exec()
    if (_.isEmpty(igAccount)) { throw new MoleculerInternalError('Couldn\'t find igAccount') }

    igAccount.status = 'fetching'
    await igAccount.save()

    // 2 - udpate cookies
    await ctx.broker.call('bot.igAccount.updateSessionCookies', { append: true, igAccountId: igAccount.igAccountId, cookies: igAccount.challenge.session.cookies })

    // 3 - fetch
    await ctx.broker.call('bot.igAccount.fetch', { igAccountId: igAccount.igAccountId })

    // all ok!
    return new OkResponse('igAccount', { igAccount: igAccount.toApi({ full }) })
  },
}
