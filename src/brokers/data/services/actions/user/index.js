

module.exports = {

  create: require('./dataUserCreateAction'),
  'mandatoryData.update': require('./dataUserMandatoryDataUpdateAction'),
  'optionalData.update': require('./dataUserOptionalDataUpdateAction'),

  'find.emailPassword': require('./dataUserFindEmailPasswordAction'),
  'find.refreshToken': require('./dataUserFindRefreshTokenAction'),
  'find.autologinToken': require('./dataUserFindAutologinTokenAction'),

  'find.id': require('./dataUserFindIdAction'),

  'send.emailVerification': require('./dataUserSendEmailVerificationAction'),

  verificateEmail: require('./dataUserVerificateEmailAction'),
}
