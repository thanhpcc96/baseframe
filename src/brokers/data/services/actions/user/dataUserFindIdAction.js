

const mongoose = require('mongoose')

const { MoleculerEntityNotFoundError } = rootRequire('./src/errors')
const { FoundResponse } = rootRequire('./src/models')

module.exports = {
  params: {
    userId: 'string',
    full: { type: 'boolean', optional: true },
    less: { type: 'boolean', optional: true },
  },
  async handler(ctx) {
    const { userId } = ctx.params
    const full = !!ctx.params.full
    const less = !!ctx.params.less

    const SmartgramUser = mongoose.model('SmartgramUser')

    let query = SmartgramUser.findById(userId)

    if (less === false) {
      query = query
        .populate('instagramAccounts')
        .populate('audiencies')
    }

    const user = await query.exec()

    if (!user) {
      throw new MoleculerEntityNotFoundError('user')
    }

    return new FoundResponse('user', { user: user.toApi({ full, less }) })
  },
}
