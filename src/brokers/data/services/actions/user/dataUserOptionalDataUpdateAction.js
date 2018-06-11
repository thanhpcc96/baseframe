

const mongoose = require('mongoose')
const _ = require('lodash')
const iso3166 = require('iso-3166-1')

const utils = rootRequire('./src/utils')
const { MoleculerEntityNotFoundError, MoleculerConflictDataError } = rootRequire('./src/errors')
const { FoundResponse } = rootRequire('./src/models')

module.exports = {
  params: {
    userId: 'string',
    country: {
      type: 'string',
      optional: true,
    },
    full: {
      type: 'boolean',
      optional: true,
    },
  },
  async handler(ctx) {
    const { userId } = ctx.params
    const { country } = ctx.params
    const full = !!ctx.params.full

    const SmartgramUser = mongoose.model('SmartgramUser')

    const user = await SmartgramUser.findById(userId).exec()
    if (!user) {
      throw new MoleculerEntityNotFoundError('user')
    }

    const countryData = iso3166.whereAlpha2(country)
    if (countryData) {
      user.country = country
      await user.save()
    }

    // all ok
    return new FoundResponse('user', { user: user.toApi({ full }) })
  },
}

