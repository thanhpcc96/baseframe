

const _ = require('lodash')
const mongoose = require('mongoose')
const { DateTime } = require('luxon')

const utils = rootRequire('./src/utils')
const { MoleculerConflictDataError, MoleculerInternalError, MoleculerEntityNotFoundError } = rootRequire('./src/errors')
const { OkResponse, CreatedResponse } = rootRequire('./src/models')

// models
let InstagramAccount = null
let SmartgramUserModel = null

// main handler
module.exports = {
  params: {
    username: 'string',
    password: 'string',
    userId: 'string',
  },
  async handler(ctx) {
    const { username, password, userId } = ctx.params

    // load models
    InstagramAccount = mongoose.model('InstagramAccount')
    SmartgramUserModel = mongoose.model('SmartgramUser')

    // get user
    const user = await SmartgramUserModel.findById(userId).exec()
    if (!user) { throw new MoleculerEntityNotFoundError('user') }

    // login and get session data(cookies, igAccountInfo)
    const responseLogin = await ctx.call('ig.account.login', { password, username, country: user.country })

    console.log('-------------responseLogin--------------------->')
    console.log(responseLogin)
    console.log('----------------------------------<')

    switch (responseLogin.code) {
    case 200:
      // all ok
      // login ok!
      return handleLoginOk(ctx, user, responseLogin.data[responseLogin.type].igAccountId, responseLogin.data[responseLogin.type].cookies)
    case 410:
      // challenge flow
      return handleChallenge(ctx, user, responseLogin)
    case 412:
      // AuthenticationError
      throw new MoleculerConflictDataError(responseLogin.message || 'Wrong username or password.')
    case 416:
      // message from ig (password changed, username not found ...)
      // throw new MoleculerConflictDataError(`Message from Instagram: ${responseLogin.message || 'Something was wrong.'}`)
      throw new MoleculerConflictDataError(responseLogin.message || 'Something was wrong.')
    default:
      ctx.broker.logger.error('unknow response from ig.login')
      ctx.broker.logger.error(responseLogin)
      throw new MoleculerInternalError()
    }
  },
}

/**
 * [handleChallenge description]
 * @param  {[type]} ctx             [description]
 * @param  {[type]} user            [description]
 * @param  {[type]} checkpointError [description]
 * @return {[type]}                 [description]
 */
async function handleChallenge(ctx, user, checkpointError) {
  if (_.isEmpty(ctx) || _.isEmpty(user) || _.isEmpty(checkpointError)) { throw new Error('Data chain broken') }

  const { username, password } = ctx.params

  const payload = {
    country: user.country,
    deviceSeed: checkpointError.session.deviceSeed,
    cookies: checkpointError.session.cookies,
    challengeData: checkpointError.json.challenge,
  }
  const igResponse = await ctx.call('ig.challenge.resolve', payload)
  if (igResponse.code !== 200) { throw igResponse }
  const challenge = igResponse.data[igResponse.type]

  const jsonAttributes = ['json.stepName', 'json.stepData', 'json.igAccountId', 'json.nonceCode', 'json.status']
  jsonAttributes.forEach((a) => {
    if (_.isNil(_.get(challenge, a))) {
      throw new Error(`Invalid challenge, challenge: ${JSON.stringify(challenge)}`)
    }
  })

  // find or create account
  let instagramAccount = null
  const accountFound = await InstagramAccount.findOne({ igAccountId: challenge.json.igAccountId }).exec()
  if (accountFound) {
    instagramAccount = accountFound
  } else {
    instagramAccount = new InstagramAccount()
    instagramAccount.owner = user.id
    instagramAccount.status = 'challengedRequired'
    instagramAccount.createdAt = DateTime.utc().toJSDate()
    instagramAccount.igAccountId = challenge.json.igAccountId
    instagramAccount.time = await getDefaultTime(ctx)
    instagramAccount.challenge = challenge
    instagramAccount.challenge.createdAt = DateTime.utc().toJSDate()
    instagramAccount.challenge.updatedAt = DateTime.utc().toJSDate()
    instagramAccount.challenge.auth = { username, password }
  }

  await checkDoesntBelongToAnotherUser(instagramAccount)

  await instagramAccount.save()

  await addAccountToUser(ctx, user, instagramAccount)

  await Promise.all([
    notifyBot(ctx, challenge.json.igAccountId, username, undefined),
    notifyStatistic(ctx, user, challenge.json.igAccountId),
  ])

  // all ok
  return new CreatedResponse('igAccount', { igAccount: instagramAccount.toApi() })
}

/**
 * [handleLoginOk description]
 * @param  {[type]} ctx         [description]
 * @param  {[type]} igAccountId [description]
 * @param  {[type]} cookies     [description]
 * @return {[type]}             [description]
 */
async function handleLoginOk(ctx, user, igAccountId, cookies) {
  if (_.isEmpty(igAccountId) || _.isEmpty(cookies)) { throw new Error('Data chain broken') }

  const { username } = ctx.params

  // find or create igAccount on our model
  let instagramAccount = null
  const accountFound = await InstagramAccount.findOne({ igAccountId }).exec()
  if (accountFound) {
    instagramAccount = accountFound
  } else {
    instagramAccount = new InstagramAccount()
    instagramAccount.owner = user.id
    instagramAccount.status = 'fetching'
    instagramAccount.createdAt = DateTime.utc().toJSDate()
    instagramAccount.igAccountId = igAccountId
    instagramAccount.username = username
    instagramAccount.time = await getDefaultTime(ctx)
  }

  await checkDoesntBelongToAnotherUser(instagramAccount)

  // update new account
  await instagramAccount.save()

  // notify other services
  await Promise.all([
    notifyBot(ctx, igAccountId, username, cookies),
    notifyStatistic(ctx, user, igAccountId),
  ])

  // add account to user
  await addAccountToUser(ctx, user, instagramAccount)

  // all ok
  return new CreatedResponse('igAccount', { igAccount: instagramAccount.toApi() })
}

/**
 * Get default free start time
 * @param  {[type]} ctx [description]
 * @return {[type]}     [description]
 */
async function getDefaultTime(ctx) {
  const responseConfig = await ctx.call('config.get', { name: 'account.default.time' })
  if (responseConfig.code !== 200) { throw responseConfig }
  const time = responseConfig.data[responseConfig.type].value
  return time
}

/**
 * [checkDoesntBelongToAnotherUser description]
 * @param  {[type]} instagramAccount [description]
 * @return {[type]}                  [description]
 */
async function checkDoesntBelongToAnotherUser(instagramAccount) {
  const anotherUserWithThisAccountFound = await InstagramAccount.findOne({
    igAccountId: instagramAccount.igAccountId,
    owner: {
      $ne: instagramAccount.owner,
    },
  })

  if (anotherUserWithThisAccountFound) {
    throw new MoleculerConflictDataError('This Instagram account is already synchronized with another SmartGram user.')
  }

  return null
}

/**
 * [notifyBot description]
 * @param  {[type]} ctx         [description]
 * @param  {[type]} igAccountId [description]
 * @param  {[type]} username    [description]
 * @param  {[type]} cookies     [description]
 * @return {[type]}             [description]
 */
async function notifyBot(ctx, igAccountId, username, cookies) {
  return ctx.call('bot.igAccount.add', {
    igAccount: {
      igAccountId,
      username,
      cookies,
    },
  })
}

/**
 * [notifyStatistic description]
 * @param  {[type]} ctx         [description]
 * @param  {[type]} user        [description]
 * @param  {[type]} igAccountId [description]
 * @return {[type]}             [description]
 */
async function notifyStatistic(ctx, user, igAccountId) {
  return ctx.call('statistic.igAccount.add', {
    igAccount: {
      igAccountId,
      owner: user._id.toString(),
    },
  })
}

/**
 * [addAccountToUser description]
 * @param {[type]} ctx              [description]
 * @param {[type]} user             [description]
 * @param {[type]} instagramAccount [description]
 */
async function addAccountToUser(ctx, user, instagramAccount) {
  const results = await SmartgramUserModel.findOneAndUpdate({
    _id: user._id,
  }, {
    $addToSet: { instagramAccounts: instagramAccount.id },
  }, {
    new: true,
  }).exec()

  if (_.isEmpty(results)) {
    throw new MoleculerEntityNotFoundError('This Instagram account is already synchronized with your Smartgram account.')
  }

  return results
}
