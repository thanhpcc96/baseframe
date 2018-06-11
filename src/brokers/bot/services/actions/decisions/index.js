

const reward = require('./botDecisionsRewardAction')
const select = require('./botDecisionsSelectAction')

module.exports = {
  'attackSource.reward': reward('attackSource'),
  'attackSource.select': select('attackSource'),
}
