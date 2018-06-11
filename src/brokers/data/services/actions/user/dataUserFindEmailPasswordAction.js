

const moment = require('moment')
const _ = require('lodash')
const mongoose = require('mongoose')

const utils = rootRequire('./src/utils')
const { MoleculerConflictDataError, MoleculerEntityNotFoundError } = rootRequire('./src/errors')
const { FoundResponse } = rootRequire('./src/models')

module.exports = {
  params: {
    email: 'string',
    password: 'string',
    ip: {
      type: 'string',
      optional: true,
    },
  },
  handler(ctx) {
    const SmartgramUser = mongoose.model('SmartgramUser')

    let email = ctx.params.email
    const password = ctx.params.password
    const ip = ctx.params.ip

    let user = null
    let isMatch = false
    const invalidEmailOrPasswordError = new MoleculerConflictDataError('Your email or password is incorrect. If you don\'t remember your password, reset it.')

    // helper
    function normalizeEmail() {
      const options = {}
      return utils.normalizeEmail(email, options)
        .then(emailIn => email = emailIn)
    }

    // helper
    function getUser() {
      return SmartgramUser
        .findOne({
          email,
        })
        .exec()
        .then((userFound) => {
          if (userFound) {
            user = userFound
            return Promise.resolve()
          }
          return Promise.reject(invalidEmailOrPasswordError)
        })
    }

    // helper
    function checkPass() {
      return user.comparePassword(password)
        .then(isMatchIn => isMatch = isMatchIn)
    }

    // helper
    function updateFailedLoginCount() {
      if (user && isMatch === false) {
        if (_.isNull(user.failedLoginCount) || _.isUndefined(user.failedLoginCount)) {
          user.failedLoginCount = 0
        }

        user.failedLoginCount += 1
        user.lastFailedLoginAt = moment().utc()

        if (!_.isEmpty(ip)) {
          user.lastFailedLoginIp = ip
        }

        return user.save()
      }
      return Promise.resolve()
    }

    // helper
    function checkMaxLoginCount() {
      if (user && user.failedLoginCount > 10) {
        return Promise.reject(new MoleculerConflictDataError('Account locked. There have been too many login failures. Contact to user support.'))
      }
      return Promise.resolve()
    }

    // helper
    function checkIsLocked() {
      if (user && user.isLocked === true) {
        return Promise.reject(new MoleculerConflictDataError('Account locked. Contact user support.'))
      }
      return Promise.resolve()
    }

    // helper
    function resetFailedLoginsOnSuccessfulLogin() {
      if (user && isMatch === true && user.failedLoginCount !== 0) {
        user.failedLoginCount = 0
        return user.save()
      }
      return Promise.resolve()
    }

    // action
    return Promise.resolve()
      .then(normalizeEmail)
      .then(getUser)
      .then(checkPass)
      .then(updateFailedLoginCount)
      .then(checkMaxLoginCount)
      .then(checkIsLocked)
      .then(resetFailedLoginsOnSuccessfulLogin)
      .then(() => {
        if (isMatch === true) {
          return Promise.resolve(new FoundResponse('user', { user: user.toApi() }))
        }
        return Promise.reject(invalidEmailOrPasswordError)
      })
  },
}

