

module.exports = {
  create: require('./dataAudienceCreateAction'),
  remove: require('./dataAudienceRemoveAction'),

  'find.user': require('./dataAudienceFindUserAction'),
  'find.id': require('./dataAudienceFindIdAction'),

  'name.update': require('./dataAudienceNameUpdateAction'),
  'locations.update': require('./dataAudienceLocationsUpdateAction'),
  'hashtags.update': require('./dataAudienceHashtagsUpdateAction'),
  'accounts.update': require('./dataAudienceAccountsUpdateAction'),

  updated: require('./dataAudienceUpdatedAction'),
}

