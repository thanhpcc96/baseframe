

const _ = require('lodash')
const errors = require('request-promise/errors')
const Promise = require('bluebird')
const util = require('util')


const Challenge = require('./Challenge')

module.exports = class EmailVerificationChallenge extends Challenge {
}

