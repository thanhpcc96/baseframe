

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
    medias: { type: 'array' },
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
    let { medias } = ctx.params

    // debug
    /*
    console.log('filtering acquistion medias! :')
    _.castArray(medias).forEach((m) => {
      console.log('---- m  --->')
      console.log(m)
    })
    */

    // ensure array and correct format
    medias = _.castArray(medias)
    medias.forEach((m) => {
      if (!_.isNumber(m.takenAt) || !_.isString(m.igId) || !_.isBoolean(m.hasLiked)) {
        ctx.broker.logger.error(`bad format - filterAcquisitionMediasAction, media: ${JSON.stringify(m)}`)
        throw new Error('medias format not valid')
      }
    })

    // ensure igAccount correct format
    if (!_.isNumber(igAccount.cycle.configuration.filters.media.age) || igAccount.cycle.configuration.filters.media.age <= 0) {
      throw new Error('Media filter age is not valid :/')
    }

    // filter medias by age
    const epochLimit = DateTime.utc().minus({ milliseconds: igAccount.cycle.configuration.filters.media.age }).valueOf()
    medias = medias.filter(m => epochLimit <= m.takenAt)

    // filter medias already liked it
    medias = medias.filter(m => m.hasLiked === false)

    // all done
    return new OkResponse('medias', { medias })
  },
}
