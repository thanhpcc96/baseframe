

const mongoose = require('mongoose')
const { DateTime } = require('luxon')

const { MoleculerEntityNotFoundError } = rootRequire('./src/errors')
const { OkResponse } = rootRequire('./src/models')

module.exports = {
  params: {
    igAccountId: 'string',
    attributes: {
      type: 'object',
    },
  },
  async handler(ctx) {
    const { igAccountId, attributes } = ctx.params

    const InstagramAccount = mongoose.model('InstagramAccount')

    const igAccount = await InstagramAccount.findOne({ igAccountId }).exec()
    if (!igAccount) { throw new MoleculerEntityNotFoundError('igAccount') }

    // update attributes
    Object.keys(attributes).filter((a) => {
      if (typeof attributes[a] === 'boolean') {
        return attributes[a] === true || attributes[a] === false
      } else if (typeof attributes[a] === 'number') {
        return attributes[a] >= 0
      } else if (typeof attributes[a] === 'string') {
        return attributes[a].length > 0
      }

      return false
    }).forEach((a) => {
      igAccount[a] = attributes[a]
    })

    igAccount.lastSynchronizedAt = DateTime.utc().toJSDate()
    igAccount.status = 'ready'

    // save
    await igAccount.save()

    // all ok
    return new OkResponse('igAccount', { igAccount: igAccount.toApi() })
  },
}

