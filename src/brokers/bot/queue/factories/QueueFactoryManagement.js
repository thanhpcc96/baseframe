'use strict';

const QueueFactoryBase = require('./QueueFactoryBase');

module.exports = class QueueFactoryControls extends QueueFactoryBase{

  constructor() {
    super();

    this.types = new Map([
      ['fetch', {
        commandToRun: 'bot.management.fetch',
        commandsToInvalidate: [],
      }, ],
    ]);
  }
}
;
