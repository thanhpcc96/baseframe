

const { OkResponse } = rootRequire('./src/models')
const Queue = rootRequire('./src/brokers/bot/queue/Queue')
const botControlHelper = require('./botControlHelper')

module.exports = {
  params: {
    igAccount: {
      type: 'object',
      props: {
        igAccountId: 'string',
      },
    },
  },
  async handler(ctx) {
    const { igAccountId } = ctx.params.igAccount

    await botControlHelper.findIgAccount(igAccountId)

    await Queue.add('cycle', 'init', igAccountId)

    return new OkResponse()
  },
}

