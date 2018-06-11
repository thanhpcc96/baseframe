

const mongoose = require('mongoose')
const _ = require('lodash')

const { MoleculerEntityNotFoundError, MoleculerConflictDataError } = rootRequire('./src/errors')

const InstagramAccount = mongoose.model('InstagramAccount')

module.exports = {

  // findIgAccount
  async findIgAccount(igAccountId) {
    const igAccountFound = await InstagramAccount.findOne({ igAccountId }).exec()

    if (!igAccountFound) {
      throw new MoleculerEntityNotFoundError('igAccount')
    }

    const error = igAccountFound.toJSON().error
    if (error !== undefined && error !== null) {
      throw new MoleculerConflictDataError('There is an error. Please contact user support.', 'THERE_IS_A_ERROR', igAccountFound)
    }

    return igAccountFound
  },

  // updateIgAccountState
  /*
  async updateIgAccountState(igAccountId, state) {
    const igAccountUpdated = await InstagramAccount.findOneAndUpdate({ igAccountId }, { $set: { state } }, { new: true })
    if (!igAccountUpdated) { throw new Error('igAccount not found') }
    return igAccountUpdated
  },
  */
}

