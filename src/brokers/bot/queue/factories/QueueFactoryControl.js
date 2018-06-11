

const QueueFactoryBase = require('./QueueFactoryBase')

module.exports = class QueueFactoryControl extends QueueFactoryBase {
  constructor() {
    super()

    this.types = new Map([
      ['start', {
        commandToRun: 'bot.control.start',
      }],
      ['stop', {
        commandToRun: 'bot.control.stop',
      }],
      ['restart', {
        commandToRun: 'bot.control.restart',
      }],
    ])
  }
}

