

module.exports = {

  add: require('./dataIgAccountAddAction'),
  'find.id': require('./dataIgAccountFindIdAction'),
  find: require('./dataIgAccountFindAction'),
  'find.igAcccountId': require('./dataIgAccountFindIgAccountIdAction'),

  'find.online': require('./dataIgAccountFindOnlineAction'),
  'find.offline': require('./dataIgAccountFindOfflineAction'),

  'update.synchronized': require('./dataIgAccountUpdateSynchronizedAction'),

  'activity.start': require('./dataIgAccountActivityStartAction'),
  'activity.stop': require('./dataIgAccountActivityStopAction'),

  'audience.update': require('./dataIgAccountAudienceUpdateAction'),
  'actions.update': require('./dataIgAccountActionsUpdateAction'),
  'speed.update': require('./dataIgAccountSpeedUpdateAction'),
  'cycleSize.update': require('./dataIgAccountCycleSizeUpdateAction'),
  'source.update': require('./dataIgAccountSourceUpdateAction'),

  'filters.attack.update': require('./dataIgAccountFiltersAttackUpdateAction'),
  'filters.unattack.update': require('./dataIgAccountFiltersUnattackUpdateAction'),
  'filters.media.update': require('./dataIgAccountFiltersMediaUpdateAction'),
  'filters.blacklist.update': require('./dataIgAccountFiltersBlacklistUpdateAction'),

  'configuration.get': require('./dataIgAccountConfigurationGetAction'),

  notifyUpdated: require('./dataIgAccountUpdatedAction'),

  'notification.create': require('./dataIgAccountNotificationCreateAction'),
  'notification.remove': require('./dataIgAccountNotificationRemoveAction'),

  stopThereIsNoMoreTime: require('./dataIgAccountStopThereIsNoMoreTimeAction'),

  'betaProgram.time.update': require('./dataIgAccountBetaProgramTimeUpdateAction'),

  'status.update': require('./dataIgAccountUpdateStatusAction'),

  'challenge.update.code': require('./dataIgAccountChallengeUpdateCodeAction'),
  'challenge.update.phone': require('./dataIgAccountChallengeUpdatePhoneAction'),
  'challenge.resolve': require('./dataIgAccountChallengeResolveAction'),
  'challenge.reset': require('./dataIgAccountChallengeResetAction'),
  'challenge.revive': require('./dataIgAccountChallengeReviveAction'),
}
