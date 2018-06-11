

const _ = require('lodash')
const mongoose = require('mongoose')

const { MoleculerEntityNotFoundError } = rootRequire('./src/errors')
const { CreatedResponse } = rootRequire('./src/models')

/**
 * Register a new user
 */

module.exports = {
  params: {
    userId: 'string',
  },
  async handler(ctx) {
    const userId = ctx.params.userId

    const Audience = mongoose.model('Audience')
    const SmartgramUser = mongoose.model('SmartgramUser')

    // action

    const user = await SmartgramUser.findById(userId).exec()
    if (!user) { throw new MoleculerEntityNotFoundError('user') }

    const audience = await new Audience({ owner: userId }).save()

    // if first audience created set defaults data
    if (user.toJSON().audiencies.length === 0) {
      const defaultData = rootRequire('./src/brokers/data/services/audienceDefaultData.json')

      audience.locations = defaultData.locations
      audience.hashtags = defaultData.hashtags
      audience.accounts = defaultData.accounts

      await audience.save()
    }

    // set audience to user and save
    user.audiencies.push(audience._id)
    await user.save()

    // all ok
    return new CreatedResponse('audience', { audience: audience.toApi() })
  },
}
