

module.exports = {
  init: require('./botCycleInitAction'),
  stop: require('./botCycleStopAction'),
  end: require('./botCycleEndAction'),

  configuration: require('./botCycleConfigurationAction'),
  planner: require('./botCyclePlannerAction'),

  searchSomeFollowings: require('./botCycleSearchSomeFollowingsAction'),
  searchFeed: require('./botCycleSearchFeedAction'),

  switchAudience: require('./botCycleSwitchAudienceAction'),

  searchAudienceAccounts: require('./botCycleSearchAudienceAccountsAction'),
  searchAudienceHashtags: require('./botCycleSearchAudienceHashtagsAction'),
  searchAudienceLocations: require('./botCycleSearchAudienceLocationsAction'),

  switchAttack: require('./botCycleSwitchAttackAction'),

  attackComplete: require('./botCycleAttackCompleteAction'),
  attackLike: require('./botCycleAttackLikeAction'),

  controlNoMoreAttackSources: require('./botCyclecontrolNoMoreAttackSourcesAction'),
  controlNoMoreUnattackSources: require('./botCyclecontrolNoMoreUnattackSourcesAction'),

  controlFollowers: require('./botCycleControlFollowersAction'),

  unattack: require('./botCycleUnattackAction'),
}

