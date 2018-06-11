

const Queue = require('./Queue')
const QueueWorker = require('./QueueWorker')

module.exports = class QueuePlannerWorker {
  constructor(broker) {
    this.broker = broker
    this.types = Queue.getQueueTypes()
    this.workers = []
    this.buildWorkers()
    this.timeBetweenTicks = 5000 // milliseconds
    this.running = false
  }

  buildWorkers() {
    this.workers = []
    this.types.forEach((type) => {
      this.workers.push(new QueueWorker(this.broker, type.name, type.jobTimeout, this.timeBetweenTicks))
    })
  }

  async start() {
    if (this.running) return null
    this.running = true
    return Promise.all(this.workers.map(w => w.start()))
  }

  async stop() {
    if (!this.running) return null
    this.running = false
    return Promise.all(this.workers.map(w => w.stop()))
  }

  async remove() {
    return Promise.all(this.workers.map(w => w.remove()))
  }
}
