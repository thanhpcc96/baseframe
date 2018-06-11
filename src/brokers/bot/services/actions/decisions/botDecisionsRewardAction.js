const _ = require('lodash')
const mongoose = require('mongoose')

const Random = require('random-js')


const { OkResponse } = rootRequire('./src/models')

const InstagramAccount = mongoose.model('InstagramAccount')


/**
 * main
 */

module.exports = function botDecisionsRewardAction(elementIn) {
  const element = elementIn

  if (_.isEmpty(element)) throw new Error('element is empty')

  return {
    params: {
      igAccount: {
        type: 'object',
      },
      arm: 'string',
      reward: 'number',
    },
    handler: async (ctx) => {
      const { igAccount, arm: armName, reward } = ctx.params
      const decisionData = igAccount.cycle.decisions[element]

      ctx.broker.logger.debug('botDecisionsRewardAction - start', { igAccountId: igAccount.igAccountId, armName, reward })

      if (_.isEmpty(decisionData)) {
        throw new Error('element is not present on data model')
      }

      const selectedArm = _.find(decisionData.arms, a => a.name === armName)

      if (selectedArm === undefined) {
        return Promise.reject(new Error('Arm not present on this model :/'))
      }

      const count = parseInt(selectedArm.count, 10) + 1
      const prior = parseFloat(selectedArm.value)

      ctx.broker.logger.debug(`botDecisionsRewardAction: prior value: ${prior}`)

      const posterior = (((count - 1) / count) * prior) + ((1 / count) * reward)

      ctx.broker.logger.debug(`botDecisionsRewardAction: posterior value: ${posterior}`)

      // update model
      const conditions = {
        igAccountId: igAccount.igAccountId,
      }
      conditions[`cycle.decisions.${elementIn}.arms.name`] = armName

      const update = {
        $set: {},
      }
      update.$set[`cycle.decisions.${elementIn}.arms.$.count`] = count
      update.$set[`cycle.decisions.${elementIn}.arms.$.value`] = posterior

      await InstagramAccount.findOneAndUpdate(conditions, update).exec()

      // all ok
      return new OkResponse()
    },

  }
}
