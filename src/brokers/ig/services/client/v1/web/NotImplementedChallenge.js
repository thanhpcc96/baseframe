

const _ = require('lodash')
const errors = require('request-promise/errors')
const Promise = require('bluebird')
const util = require('util')

const Challenge = require('./Challenge')


module.exports = class NotImplementedChallenge extends Challenge {
  constructor(...args) {
    console.log(JSON.stringify(args, null, 4))
    throw new Error('NotImplementedChallenge - Not implemented')
  }
}

