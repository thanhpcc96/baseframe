

const _ = require('lodash')

const oauth = require('./../oauth')

/**
 * oath2 refrest tokens - read by bearer token and check by jwt
 * @param  {[type]}   req  [description]
 * @param  {[type]}   res  [description]
 * @param  {Function} next [description]
 * @return {[type]}        [description]
 */

module.exports = (req, res, next) => {
  oauth.verify(req.token)
    .then((authorizedData) => {
      if (_.isEmpty(authorizedData) || _.isEmpty(authorizedData.userId)) {
        res.jsonError(401, 'OAuthException', 'Error validating access token')
      } else {
        req.userId = authorizedData.userId
        next()
      }
    })
    .catch(err => res.manageResponseObject(err))
}
