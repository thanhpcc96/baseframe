

const QueueStrategyBase = require('./QueueStrategyBase')

module.exports = class QueueStrategyCycle extends QueueStrategyBase {
  // action add
  static async addJob(igAccountId, queueName, job) {
    try {
      const igAccount = await this.findIgAccountAndCheckNoError(igAccountId)

      // if (igAccount.state === 'started') {
      await this.removeCompletedJobs(igAccountId, queueName)
      await this.addJobToInstagramAccount(igAccountId, queueName, job)
      // }
    } catch (error) {
      console.error(`error adding new job to queue. addJob(${igAccountId}, ${queueName}, ${job})`)
      throw error
    }
  }
}

