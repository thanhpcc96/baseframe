

const { OkResponse } = rootRequire('./src/models')
const { handlerIgError } = require('./../../utils')

module.exports = {
  params: {
    igAccount: {
      type: 'object',
      props: {
        igAccountId: 'string',
        cookies: 'array',
      },
    },
  },
  async handler(ctx) {
    const { igAccount } = ctx.params
    const { igAccountId } = ctx.params.igAccount

    // make request - secure zone
    let fetchResponse
    try {
      fetchResponse = await ctx.call('ig.account.fetch', { igAccount })
      if (fetchResponse.code !== 200) throw fetchResponse
    } catch (err) {
      return handlerIgError(ctx, igAccount, err)
    }

    // request ok
    const attributes = fetchResponse.data[fetchResponse.type]
    await ctx.call('data.igAccount.update.synchronized', { igAccountId, attributes })

    // all ok
    return new OkResponse()
  },
}
