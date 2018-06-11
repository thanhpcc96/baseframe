

const {
  OauthMiddleware,
} = require('./../middlewares')

const {
  igAccountAddController,
  igAccountGetController,
  igAccountListController,
  igAccountListOnlineController,
  igAccountListOfflineController,
  igAccountStartActivityController,
  igAccountStopActivityController,
  igAccountModifyActionsController,
  igAccountModifyAudienceController,
  igAccountModifySpeedController,
  igAccountModifyCycleSizeController,
  igAccountModifySourceController,
  igAccountModifyFiltersAttackController,
  igAccountModifyFiltersUnattackController,
  igAccountModifyFiltersMediaController,
  igAccountModifyFiltersBlacklistController,
  igAccountGetRecordsController,
  igAccountDeleteNotificationController,
  igAccountGetStatisticController,
  igAccountSetChallengeCodeController,
  igAccountSetChallengePhoneController,
  igAccountResetChallengeController,
  igAccountResolveChallengeController,
} = require('./igAccount')

const {
  betaProgramTimeController,
} = require('./beta-program')

module.exports = (router) => {
  router.all('/accounts', OauthMiddleware)
  router.all('/accounts/*', OauthMiddleware)

  router.route('/accounts')
    .get(igAccountListController)
    .post(igAccountAddController)

  router.route('/accounts/online')
    .get(igAccountListOnlineController)

  router.route('/accounts/offline')
    .get(igAccountListOfflineController)

  router.route('/accounts/:igAccountId')
    .get(igAccountGetController)

  // control actions
  router.route('/accounts/:igAccountId/start')
    .get(igAccountStartActivityController)

  router.route('/accounts/:igAccountId/stop')
    .get(igAccountStopActivityController)

  // configuration
  router.route('/accounts/:igAccountId/configuration/actions')
    .put(igAccountModifyActionsController)

  router.route('/accounts/:igAccountId/configuration/audience')
    .put(igAccountModifyAudienceController)

  router.route('/accounts/:igAccountId/configuration/speed')
    .put(igAccountModifySpeedController)

  router.route('/accounts/:igAccountId/configuration/cycleSize')
    .put(igAccountModifyCycleSizeController)

  router.route('/accounts/:igAccountId/configuration/source')
    .put(igAccountModifySourceController)

  router.route('/accounts/:igAccountId/configuration/filters/attack')
    .put(igAccountModifyFiltersAttackController)

  router.route('/accounts/:igAccountId/configuration/filters/unattack')
    .put(igAccountModifyFiltersUnattackController)

  router.route('/accounts/:igAccountId/configuration/filters/media')
    .put(igAccountModifyFiltersMediaController)

  router.route('/accounts/:igAccountId/configuration/filters/blacklist')
    .put(igAccountModifyFiltersBlacklistController)

  // beta testers users
  router.route('/accounts/:igAccountId/beta-program/time')
    .post(betaProgramTimeController)

  // no group
  router.route('/accounts/:igAccountId/notifications/:notificationId/')
    .delete(igAccountDeleteNotificationController)

  router.route('/accounts/:igAccountId/records')
    .get(igAccountGetRecordsController)

  router.route('/accounts/:igAccountId/statistics')
    .get(igAccountGetStatisticController)

  // challenge control
  router.route('/accounts/:igAccountId/challange/code')
    .post(igAccountSetChallengeCodeController)

  router.route('/accounts/:igAccountId/challange/phone')
    .post(igAccountSetChallengePhoneController)

  router.route('/accounts/:igAccountId/challange/reset')
    .post(igAccountResetChallengeController)

  router.route('/accounts/:igAccountId/challange/resolve')
    .post(igAccountResolveChallengeController)
}
