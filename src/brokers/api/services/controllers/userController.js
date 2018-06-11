

const {
  UserGetController,
  UserCreateController,
  UserModifyOptionalDataController,
  UserModifyMandatoryDataController,
} = require('./user')

const {
  OauthMiddleware,
} = require('./../middlewares')

module.exports = (router) => {
  router.post('/users', UserCreateController)
  router.get('/user', OauthMiddleware, UserGetController)
  router.put('/users/:userId/mandatory', OauthMiddleware, UserModifyMandatoryDataController)
  router.put('/users/:userId/optional', OauthMiddleware, UserModifyOptionalDataController)
}
