

const cluster = require('cluster')
const os = require('os')
const path = require('path')

const lodash = require('lodash')

/**
 * The entry point of the program. Configures the cluster
 * in the master process and then creates workers.
 *
 * If `forkee` is a function, the worker processes will simply execute it.
 * However, if `forkee` is a string it is assumed to be a path and worker
 * processes will run the file at that path instead.
 *
 * @param {Function|String} forkee Function to call or file to require.
 * @param {Object} options The options passed to the program.
 */

module.exports = function run(forkee, options) {
  options = lodash.defaults(options, {
    verbose: false,
    refork: false,
    concurrency: 1,
  })

  const log = message => options.verbose && console.log(message)

  if (cluster.isMaster) {
    if (typeof forkee === 'string') {
      cluster.setupMaster({
        exec: path.join(process.cwd(), forkee),
      })
    }

    cluster
      .on('fork', (worker) => {
        log(`created worker (pid=${worker.process.pid})`)
      })
      .on('listening', (worker, addr) => {
        log(`worker (pid=${worker.process.pid}) listening on ${addr.port}`)
      })
      .on('exit', (worker, code, signal) => {
        log(`worker (pid=${worker.process.pid}) died (${signal || code})`)
        if (options.refork && code > 0) {
          cluster.fork()
        }
      })

    process.on('SIGINT', () => {
      console.log('Received SIGINT.  Press Control-D to exit.')
    })

    process.on('SIGTERM', () => {
      console.log('Received SIGTERM.  Press Control-D to exit.')
    })

    process.on('unhandledRejection', (err) => {
      console.error('unhandledRejection')
      console.error(err)
      process.exit(-1)
    })

    lodash.times(options.concurrency || os.cpus().length, cluster.fork)
  } else {
    forkee()
  }
}

