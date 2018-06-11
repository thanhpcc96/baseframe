

const mongoose = require('mongoose')
const _ = require('lodash')
const util = require('util')
const tough = require('tough-cookie')
const MemoryCookieStore = require('tough-cookie/lib/memstore.js').MemoryCookieStore

const { OkResponse } = rootRequire('./src/models')
const { FoundResponse, NotFoundResponse } = rootRequire('./src/models')

module.exports = {
  params: {
    igAccountId: 'string',
    cookies: 'array',
    append: { type: 'boolean', optional: true },
  },
  async handler(ctx) {
    const { igAccountId } = ctx.params
    const cookiesIn = _.get(ctx, 'params.cookies', [])
    const append = _.get(ctx, 'params.append', false)

    const InstagramAccount = mongoose.model('InstagramAccount')

    // igAccount
    const igAccount = await InstagramAccount.findOne({ igAccountId }).exec()
    if (!igAccount) { throw new NotFoundResponse('igAccount') }

    // check cookiesIn
    if (!_.isArray(cookiesIn) || cookiesIn.length === 0) {
      throw new Error('cookies input not valid')
    }

    _.forEach(cookiesIn, (cookieIn) => {
      if (_.isNil(_.get(cookieIn, 'key')) || _.isNil(_.get(cookieIn, 'value'))) {
        throw new Error(`cookie not valid, cookie: ${cookieIn}`)
      }
    })

    // get all current cookies and set to storage
    const Cookie = tough.Cookie
    const storage = new MemoryCookieStore()

    if (append === true) {
      _.forEach(igAccount.cookies, (cookieObject) => {
        storage.putCookie(Cookie.fromJSON(JSON.stringify(cookieObject)), () => {})
      })
    }

    // add new cookies
    _.forEach(cookiesIn, (cookieIn) => {
      storage.putCookie(Cookie.fromJSON(JSON.stringify(cookieIn)), () => {})
    })

    // get all cookies
    const getAllCookies = util.promisify(storage.getAllCookies)
    const allCookies = await getAllCookies.call(storage)

    // update model
    igAccount.cookies = allCookies
    await igAccount.save()

    // all ok
    return new OkResponse('igAccount', { igAccount: igAccount.toApi() })
  },
}

