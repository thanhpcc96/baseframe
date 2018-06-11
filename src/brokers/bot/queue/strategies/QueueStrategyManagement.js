

const QueueStrategyBase = require('./QueueStrategyBase')

module.exports = class QueueStrategyManagement extends QueueStrategyBase {
  // action add
  static async addJob(igAccountId, queueName, job) {
    try {
      await this.findIgAccountAndCheckNoError(igAccountId)
      await this.removeCompletedJobs(igAccountId, queueName)
      await this.addJobToInstagramAccount(igAccountId, queueName, job)
    } catch (error) {
      console.error(`error adding new job to queue. addJob(${igAccountId}, ${queueName}, ${job})`)
      throw error
    }
  }
}

