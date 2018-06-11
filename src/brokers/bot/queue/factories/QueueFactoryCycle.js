

const QueueFactoryBase = require('./QueueFactoryBase')

module.exports = class QueueFactoryCycle extends QueueFactoryBase {
  constructor() {
    super()

    this.types = new Map([
      ['init', {
        commandToRun: 'bot.cycle.init',
      }],
      ['configuration', {
        commandToRun: 'bot.cycle.configuration',
      }],
      ['planner', {
        commandToRun: 'bot.cycle.planner',
      }],
      ['stop', {
        commandToRun: 'bot.cycle.stop',
      }],
      ['end', {
        commandToRun: 'bot.cycle.end',
      }],
      ['searchFeed', {
        commandToRun: 'bot.cycle.searchFeed',
      }],
      ['switchAudience', {
        commandToRun: 'bot.cycle.switchAudience',
      }],
      ['searchSomeFollowings', {
        commandToRun: 'bot.cycle.searchSomeFollowings',
      }],
      ['controlNoMoreAttackSources', {
        commandToRun: 'bot.cycle.controlNoMoreAttackSources',
      }],
      ['searchAudienceAccounts', {
        commandToRun: 'bot.cycle.searchAudienceAccounts',
      }],
      ['searchAudienceHashtags', {
        commandToRun: 'bot.cycle.searchAudienceHashtags',
      }],
      ['searchAudienceLocations', {
        commandToRun: 'bot.cycle.searchAudienceLocations',
      }],
      ['switchAttack', {
        commandToRun: 'bot.cycle.switchAttack',
      }],
      ['attackComplete', {
        commandToRun: 'bot.cycle.attackComplete',
      }],
      ['attackLike', {
        commandToRun: 'bot.cycle.attackLike',
      }],
      ['controlNoMoreUnattackSources', {
        commandToRun: 'bot.cycle.controlNoMoreUnattackSources',
      }],
      ['unattack', {
        commandToRun: 'bot.cycle.unattack',
      }],
      ['controlFollowers', {
        commandToRun: 'bot.cycle.controlFollowers',
      }],
    ])
  }
}

