

const mongoose = require('mongoose')
const _ = require('lodash')
const { DateTime } = require('luxon')

const BotQueueWorkerRegisterModel = mongoose.model('BotQueueWorkerRegisterModel')

module.exports = class WorkerRegister {
  static async removeOldWorkers() {
    return BotQueueWorkerRegisterModel
      .collection
      .remove({
        createdAt: { $lte: DateTime.utc().minus({ minutes: 30 }).toJSDate() },
        $or: [{
          lastTickAt: null,
        }, {
          lastTickAt: { $lte: DateTime.utc().minus({ minutes: 30 }).toJSDate() },
        }],
      })
  }

  static async add(worker) {
    const workerFound = await BotQueueWorkerRegisterModel.findOne({ workerId: worker.id }).exec()
    if (workerFound) throw new Error('Worker already added')

    const workerModel = new BotQueueWorkerRegisterModel()
    workerModel.workerId = worker.id
    workerModel.queue = worker.queueName
    workerModel.beat = worker.timeBetweenTicks
    workerModel.nodeID = worker.broker.nodeID
    workerModel.lastTickAt = null

    return workerModel.save()
  }

  static async remove(worker) {
    return BotQueueWorkerRegisterModel.remove({ workerId: worker.id }).exec()
  }

  static async workerBeat(worker) {
    return BotQueueWorkerRegisterModel
      .collection
      .findOneAndUpdate({
        workerId: worker.id,
      }, {
        $set: { lastTickAt: DateTime.utc().toJSDate() },
      }, {
        j: false,
      })
  }

  static async updateStatus(worker, status) {
    if (status !== 'startted' && status !== 'stopped') throw new Error('status is not valid ')
    return BotQueueWorkerRegisterModel.collection.findOneAndUpdate({ workerId: worker.id }, { $set: { status } }, { returnNewDocument: true })
  }
}
