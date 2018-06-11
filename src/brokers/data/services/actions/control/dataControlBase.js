

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
  findIgAccount(igAccountId) {
    const InstagramAccount = mongoose.model('InstagramAccount')

    return InstagramAccount
      .findOne({
        igAccountId,
      })
      .exec()
      .then((igAccountFound) => {
        if (igAccountFound) {
          return Promise.resolve(igAccountFound)
        }
        return Promise.reject(new MoleculerEntityNotFoundError('igAccount'))
      })
  },


}

