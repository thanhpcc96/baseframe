

const { OkResponse } = rootRequire('./src/models')

// const Client = require('instagram-private-api').V1
const Client = require('./../../client')

const {
  igApiErrorHandler,
  igBuildSession,
  filterResponse,
  addHistoricEntry,
  igUpdateSession,
} = require('./../../utils')

// 1. GET /api/v1/users/6755209280/info/ HTTP/1.1
// 2. POST /api/v1/discover/profile_su_badge/ HTTP/1.1
// 3. GET /api/v1/feed/user/6755209280/story/ HTTP/1.1
// 4. GET /api/v1/feed/user/6755209280/ HTTP/1.1

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

    addHistoricEntry(ctx, igAccount, 'fetchAccount')

    // get session
    const session = await igBuildSession(ctx, igAccount)

    // 1. get my own profile
    // 2. get discover profile badge - (like real app but ignore them)
    // 3. get my stories - (like real app but ignore them)
    // 4. get my feed medias - (like real app but ignore them)
    const results = await Promise.all([
      Client.Account.getById(session, igAccountId),
      Client.Discover.postProfileSuBadge(session),
      Client.Story.getByUserId(session, igAccountId),
      (new Client.Feed.UserMedia(session, igAccountId)).get(),
    ])

    const getProfileInfoResponse = results[0]

    // update session
    await igUpdateSession(ctx, igAccount, session)

    const allowedAttributes = ['fullName', 'isPrivate', 'profilePicUrl', 'isVerified', 'mediaCount', 'geoMediaCount', 'followerCount', 'followingCount', 'biography', 'externalUrl', 'isBusiness', 'category']
    const accountData = filterResponse(getProfileInfoResponse.getParams(), allowedAttributes)

    return new OkResponse('igAccountRaw', { igAccountRaw: accountData })
  },
}
