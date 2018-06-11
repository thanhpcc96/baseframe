

const {
  audienceListController,
  audienceGetController,
  audienceNewController,
  audienceRemoveController,
  audienceUpdateNameController,
  audienceUpdateLocationsController,
  audienceUpdateHashtagsController,
  audienceUpdateAccountsController,
} = require('./audience')

const {
  OauthMiddleware,
} = require('./../middlewares')

module.exports = (router) => {
  router.all('/audiences', OauthMiddleware)
  router.route('/audiences')
    .get(audienceListController)
    .post(audienceNewController)

  router.all('/audiences/*', OauthMiddleware)
  router.get('/audiences/:audienceId', audienceGetController)
  router.delete('/audiences/:audienceId', audienceRemoveController)
  router.put('/audiences/:audienceId/name', audienceUpdateNameController)
  router.put('/audiences/:audienceId/locations', audienceUpdateLocationsController)
  router.put('/audiences/:audienceId/hashtags', audienceUpdateHashtagsController)
  router.put('/audiences/:audienceId/accounts', audienceUpdateAccountsController)
}
