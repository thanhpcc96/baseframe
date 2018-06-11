

const _ = require('lodash')
const mongoose = require('mongoose')

const { MoleculerEntityNotFoundError } = rootRequire('./src/errors')


/**
 * [exports description]
 * @type {Object}
 */
module.exports = {
  params: {
    igAccount: {
      type: 'object',
      props: {
        igAccountId: 'string',
      },
    },
    state: {
      type: 'string',
      optional: true,
    },
  },
  handler() {
    throw new Error('Handler not implemented')
  },

  // findIgAccount
  async updateIgAccountControlActivity(igAccountId, activity) {
    if (!['started', 'stopped'].includes(activity)) { throw new Error('activity is not valid') }

    const IgAccountControlModel = mongoose.model('IgAccountControl')

    const igAccountControl = await IgAccountControlModel.findOneAndUpdate({ igAccountId }, { $set: { activity } }).exec()
    if (_.isEmpty(igAccountControl)) { throw new MoleculerEntityNotFoundError('IgAccountControl') }

    return igAccountControl
  },


}

