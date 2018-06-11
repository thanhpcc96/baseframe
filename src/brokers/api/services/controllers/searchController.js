
const _ = require('lodash')
const { check } = require('express-validator/check')
const { matchedData } = require('express-validator/filter')

const { validationHandlerMiddleware, OauthMiddleware } = require('./../middlewares')

const { MoleculerConflictDataError } = rootRequire('./src/errors')


/**
 * [searchValidation description]
 * @type {Array}
 */
const searchValidation = [
  check('query').exists().trim(),
]

/**
 * [search description]
 * @param  {[type]}   cmd  [description]
 * @param  {[type]}   req  [description]
 * @param  {[type]}   res  [description]
 * @param  {Function} next [description]
 * @return {[type]}        [description]
 */
function search(cmdSearch, req, res) {
  const query = matchedData(req).query

  res.manageServiceResponse((async () => {
    // let find a valid ig account

    const userIgAccountsResponse = await req.broker.call('data.igAccount.find.online', { less: true, userId: req.userId })
    if (userIgAccountsResponse.code !== 200) throw userIgAccountsResponse

    const igAccounts = _.shuffle(userIgAccountsResponse.data[userIgAccountsResponse.type])
    let igAccount = null
    let i = 0
    do {
      const resultFind = await req.broker.call('bot.igAccount.findOne.igAccountId', { igAccountId: igAccounts[i].igAccountId })
      if (resultFind.code === 200) {
        igAccount = resultFind.data[resultFind.type]
      } else if (resultFind.code === 404) {
        throw resultFind
      }
      i += 1
    } while (_.isEmpty(igAccount) && i < igAccounts.length)

    if (_.isEmpty(igAccount)) {
      throw new MoleculerConflictDataError('Sorry but you dont have any Instagram account synchronized.')
    }

    return req.broker.call(cmdSearch, { query, igAccount })
  })())
}

/**
 * [description]
 * @param  {[type]} router [description]
 * @return {[type]}        [description]
 */
module.exports = (router) => {
  router.get('/search/location', OauthMiddleware, searchValidation, validationHandlerMiddleware, search.bind(this, 'ig.search.location'))
  router.get('/search/hashtag', OauthMiddleware, searchValidation, validationHandlerMiddleware, search.bind(this, 'ig.search.hashtag'))
  router.get('/search/account', OauthMiddleware, searchValidation, validationHandlerMiddleware, search.bind(this, 'ig.search.account'))
}
