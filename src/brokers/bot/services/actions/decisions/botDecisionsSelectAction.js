

const _ = require('lodash')
const Random = require('random-js')

const { OkResponse } = rootRequire('./src/models')

/**
 * main
 */

module.exports = function botDecisionsSelectAction(elementIn) {
  const element = elementIn

  if (_.isEmpty(element)) throw new Error('element is empty')

  return {
    params: {
      igAccount: {
        type: 'object',
      },
    },
    handler: async (ctx) => {
      const { igAccount } = ctx.params
      const decisionData = igAccount.cycle.decisions[element]

      if (_.isEmpty(decisionData)) {
        throw new Error('element is not present on data model')
      }

      const epsilon = decisionData.epsilon
      const n = decisionData.arms.map(arm => arm.count).reduce((a, b) => a + b)
      const random = new Random(Random.engines.mt19937().autoSeed())
      const r = random.real(0, 1, true)

      let optionSelected = null

      if (epsilon > r || n === 0) {
        const index = random.integer(0, decisionData.arms.length - 1)
        optionSelected = decisionData.arms[index]
      } else {
        optionSelected = _.sortBy(decisionData.arms, arm => arm.value).pop()
      }

      ctx.broker.logger.debug(`botDecisionsSelectAction - threshold (epsilon=${epsilon} vs r=${r}), arm:${optionSelected.name}`)

      return new OkResponse('arm', { arm: optionSelected.name })
    },

  }
}
