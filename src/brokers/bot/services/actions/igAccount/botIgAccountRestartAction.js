

const { OkResponse } = rootRequire('./src/models')
const Queue = rootRequire('./src/brokers/bot/queue/Queue')

module.exports = {
  params: {
    igAccount: {
      type: 'object',
      props: {
        igAccountId: 'string',
      },
    },
    time: 'number',
  },
  async handler(ctx) {
    const { igAccount, time } = ctx.params
    await Queue.add('control', 'restart', igAccount.igAccountId, time)
    return new OkResponse()
  },
}

