

const _ = require('lodash')
const util = require('util')
// const routes = require('./routes')
const camelKeys = require('camelcase-keys')

// Basic error
function APIError(message) {
  this.code = -1
  this.name = 'APIError'
  this.message = (message || 'Instagram API error was made.')
}

util.inherits(APIError, Error)
exports.APIError = APIError

APIError.prototype.serialize = function serialize() {
  return {
    error: this.constructor.name,
    errorMessage: this.message,
  }
}

APIError.prototype.toApi = async function toApi() {
  return {
    code: this.code,
    name: this.name,
    message: this.message,
    url: this.url ? this.url : undefined,
    json: this.json ? camelKeys(this.json, { deep: true }) : undefined,
    session: this.session ? await this.session.toApi() : undefined,
  }
}

function NotImplementedError(message) {
  this.name = 'NotImplementedError'
  this.message = (message || 'This method is actually not implemented')
}
util.inherits(NotImplementedError, APIError)
exports.NotImplementedError = NotImplementedError


function NotAbleToSignError() {
  this.name = 'NotAbleToSign'
  this.message = 'It\'s not possible to sign request!'
}
util.inherits(NotAbleToSignError, APIError)
exports.NotAbleToSignError = NotAbleToSignError


function RequestError(payload, session) {
  this.code = 416
  this.name = 'RequestError'
  this.message = 'It\'s not possible to make request!'
  this.json = {}
  if (_.isString(payload.message)) { this.message = payload.message }
  if (_.isObject(payload)) {
    this.json = payload
  }
  this.session = session
}
util.inherits(RequestError, APIError)
exports.RequestError = RequestError

// RequestProxyError
function RequestProxyError(payload, session) {
  this.code = 505
  this.name = 'RequestProxyError'
  this.message = 'It\'s not possible to make request!'
  this.json = {}
  if (_.isString(payload.message)) { this.message = payload.message }
  if (_.isObject(payload)) {
    this.json = payload
  }
  this.session = session
}
util.inherits(RequestProxyError, APIError)
exports.RequestProxyError = RequestProxyError

function AuthenticationError(json, message) {
  this.code = 412
  this.json = json
  this.name = 'AuthenticationError'
  this.message = message || 'Not possible to authenticate'
}
util.inherits(AuthenticationError, APIError)
exports.AuthenticationError = AuthenticationError


function ParseError(response, request) {
  this.code = 417
  this.name = 'ParseError'
  this.message = 'Not possible to parse API response'
  this.response = response
  this.request = request
}

util.inherits(ParseError, APIError)
exports.ParseError = ParseError

ParseError.prototype.getUrl = function () {
  return this.request.url
}


function ActionSpamError(json) {
  this.code = 413
  this.json = json
  this.name = 'ActionSpamError'
  this.message = 'This action was disabled due to block from instagram!'
}
util.inherits(ActionSpamError, APIError)
exports.ActionSpamError = ActionSpamError

ActionSpamError.prototype.serialize = function () {
  return _.extend(APIError.prototype.serialize.call(this), {
    errorData: {
      blockTime: this.getBlockTime(),
      message: this.getFeedbackMessage(),
    },
  })
}

ActionSpamError.prototype.getBlockTime = function () {
  if (_.isObject(this.json) && _.isString(this.json.feedback_message)) {
    const hours = this.json.feedback_message.match(/(\d+)(\s)*hour(s)/)
    if (!hours || !_.isArray(hours)) return 0
    const blockTime = parseInt(hours[1]) * 60 * 60 * 1000
    return blockTime + (1000 * 60 * 5)
  }
  return 0
}

ActionSpamError.prototype.getFeedbackMessage = function () {
  let message = 'No feedback message'
  if (_.isString(this.json.feedback_message)) {
    const title = _.isString(this.json.feedback_title) ? (`${this.json.feedback_title}: `) : ''
    message = title + this.json.feedback_message
  }
  return message
}


function CheckpointError(json, session) {
  this.code = 410
  this.json = json
  this.name = 'CheckpointError'
  // this.message = 'Instagram call checkpoint for this action!'
  // if (_.isString(json.checkpoint_url)) { this.url = json.checkpoint_url }
  // if (!this.url && _.isObject(json.checkpoint) && _.isString(json.checkpoint.url)) { this.url = json.checkpoint.url }
  // if (!this.url) { this.url = routes.getWebUrl('challenge') }
  this.session = session
}
util.inherits(CheckpointError, APIError)
exports.CheckpointError = CheckpointError


function SentryBlockError(json) {
  this.code = 411
  this.name = 'SentryBlockError'
  // this.message = 'Sentry block from instagram'
  this.json = json
}
util.inherits(SentryBlockError, APIError)
exports.SentryBlockError = SentryBlockError


function OnlyRankedItemsError() {
  this.name = 'OnlyRankedItemsError'
  this.message = 'Tag has only ranked items to show, due to blocked content'
}
util.inherits(OnlyRankedItemsError, APIError)
exports.OnlyRankedItemsError = OnlyRankedItemsError


function NotFoundError(response) {
  this.code = 404
  this.name = 'NotFoundError'
  this.message = 'Page wasn\'t found!'
  this.response = response
}

util.inherits(NotFoundError, APIError)
exports.NotFoundError = NotFoundError


function PrivateUserError() {
  this.code = 415
  this.name = 'PrivateUserError'
  this.message = 'User is private and you are not authorized to view his content!'
}

util.inherits(PrivateUserError, APIError)
exports.PrivateUserError = PrivateUserError


function InvalidParamsError(object) {
  this.code = 418
  this.name = 'InvalidParamsError'
  this.message = 'There was validation error and problem with input you supply'
  this.errorData = object
}

util.inherits(InvalidParamsError, APIError)
exports.InvalidParamsError = InvalidParamsError

InvalidParamsError.prototype.serialize = function () {
  const object = APIError.prototype.serialize.call(this)
  return _.extend(object, {
    errorData: this.errorData,
  })
}


function TooManyFollowsError() {
  this.code = 419
  this.name = 'TooManyFollowsError'
  this.message = 'Account has just too much follows'
}

util.inherits(TooManyFollowsError, APIError)
exports.TooManyFollowsError = TooManyFollowsError


function RequestsLimitError() {
  this.code = 414
  this.name = 'RequestsLimitError'
  this.message = 'You just made too many request to instagram API'
}

util.inherits(RequestsLimitError, APIError)
exports.RequestsLimitError = RequestsLimitError


function CookieNotValidError(cookieName) {
  this.code = 420
  this.name = 'CookieNotValidError'
  this.message = `Cookie \`${cookieName}\` you are searching found was either not found or not valid!`
}

util.inherits(CookieNotValidError, APIError)
exports.CookieNotValidError = CookieNotValidError


function IGAccountNotFoundError() {
  this.code = 421
  this.name = 'IGAccountNotFoundError'
  this.message = 'Account you are searching for was not found!'
}

util.inherits(IGAccountNotFoundError, APIError)
exports.IGAccountNotFoundError = IGAccountNotFoundError


function ThreadEmptyError() {
  this.code = 422
  this.name = 'ThreadEmptyError'
  this.message = 'Thread is empty there are no items!'
}

util.inherits(ThreadEmptyError, APIError)
exports.ThreadEmptyError = ThreadEmptyError


function AccountInactive(accountInstance) {
  this.code = 423
  this.name = 'AccountInactive'
  this.message = 'The account you are trying to propagate is inactive'
  this.account = accountInstance
}

util.inherits(AccountInactive, APIError)
exports.AccountInactive = AccountInactive


function AccountBanned(message) {
  this.code = 424
  this.name = 'AccountBanned'
  this.message = message
}

util.inherits(AccountBanned, APIError)
exports.AccountBanned = AccountBanned


function AccountActivityPrivateFeed() {
  this.code = 425
  this.name = 'AccountActivityPrivateFeed'
  this.message = 'The Account has private feed, account activity not really completed'
}

util.inherits(AccountActivityPrivateFeed, APIError)
exports.AccountActivityPrivateFeed = AccountActivityPrivateFeed


function PlaceNotFound() {
  this.code = 426
  this.name = 'PlaceNotFound'
  this.message = 'Place you are searching for not exists!'
}

util.inherits(PlaceNotFound, APIError)
exports.PlaceNotFound = PlaceNotFound


function NotPossibleToResolveChallenge(reason, code) {
  this.code = 427
  this.name = 'NotPossibleToResolveChallenge'
  this.reason = reason || 'Unknown reason'
  this.code = code || NotPossibleToResolveChallenge.CODE.UNKNOWN
  this.message = `Not possible to resolve challenge (${reason})!`
}

util.inherits(NotPossibleToResolveChallenge, APIError)
exports.NotPossibleToResolveChallenge = NotPossibleToResolveChallenge

NotPossibleToResolveChallenge.CODE = {
  RESET_NOT_WORKING: 'RESET_NOT_WORKING',
  NOT_ACCEPTING_NUMBER: 'NOT_ACCEPTING_NUMBER',
  INCORRECT_NUMBER: 'INCORRECT_NUMBER',
  INCORRECT_CODE: 'INCORRECT_CODE',
  UNKNOWN: 'UNKNOWN',
  UNABLE_TO_PARSE: 'UNABLE_TO_PARSE',
  NOT_ACCEPTED: 'NOT_ACCEPTED',
}


function NotPossibleToVerify() {
  this.code = 428
  this.name = 'NotPossibleToVerify'
  this.message = 'Not possible to verify trough code!'
}

util.inherits(NotPossibleToVerify, APIError)
exports.NotPossibleToVerify = NotPossibleToVerify


function NoChallengeRequired() {
  this.code = 429
  this.name = 'NoChallengeRequired'
  this.message = 'No challenge is required to use account!'
}

util.inherits(NoChallengeRequired, APIError)
exports.NoChallengeRequired = NoChallengeRequired


function InvalidEmail(email, json) {
  this.name = 'InvalidEmail'
  this.message = `${email} email is not an valid email`
  this.json = json
}

util.inherits(InvalidEmail, APIError)
exports.InvalidEmail = InvalidEmail


function InvalidUsername(username, json) {
  this.name = 'InvalidUsername'
  this.message = `${username} username is not an valid username`
  this.json = json
}

util.inherits(InvalidUsername, APIError)
exports.InvalidUsername = InvalidUsername


function InvalidPhone(phone, json) {
  this.name = 'InvalidPhone'
  this.message = `${phone} phone is not a valid phone`
  this.json = json
}

util.inherits(InvalidPhone, APIError)
exports.InvalidPhone = InvalidPhone


function InvalidPassword() {
  this.name = 'InvalidPassword'
  this.message = 'Password must be at least 6 chars long'
}

util.inherits(InvalidPassword, APIError)
exports.InvalidPassword = InvalidPassword


function AccountRegistrationError(message, json) {
  this.name = 'AccountRegistrationError'
  this.message = message
  this.json = json
  if (_.isObject(json) && json.errors && !message) {
    this.message = ''
    for (const key in json.errors) {
      this.message += json.errors[key].join('. ')
    }
  }
}

util.inherits(AccountRegistrationError, APIError)
exports.AccountRegistrationError = AccountRegistrationError

function TranscodeTimeoutError() {
  this.name = 'TranscodeError'
  this.message = 'Server did not transcoded uploaded video in time'
}
util.inherits(TranscodeTimeoutError, APIError)
exports.TranscodeTimeoutError = TranscodeTimeoutError


function MediaUnavailableError() {
  this.name = 'MediaUnavailableError'
  this.message = 'Media is unavailable'
}
util.inherits(MediaUnavailableError, APIError)
exports.MediaUnavailableError = MediaUnavailableError
