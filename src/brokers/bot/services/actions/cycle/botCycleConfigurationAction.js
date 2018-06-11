

const _ = require('lodash')
const mongoose = require('mongoose')
const { DateTime, Duration } = require('luxon')
const iso3166 = require('iso-3166-1')

const { OkResponse } = rootRequire('./src/models')
const { MoleculerConflictDataError, MoleculerInternalError } = rootRequire('./src/errors')
const botCycleBaseAction = require('./botCycleBaseAction')

/**
 * main
 */

const action = _.defaultsDeep({}, botCycleBaseAction)

action.handler = async (ctx) => {
  const { igAccount } = ctx.params
  const { igAccountId } = ctx.params.igAccount

  const InstagramAccount = mongoose.model('InstagramAccount')

  // 0. do we have cookies?

  if (_.isNil(igAccount.cookies) || _.isEmpty(igAccount.cookies)) {
    throw new MoleculerInternalError('there is not cookies :/')
  }

  // 1.

  await action.saveCurrentState(igAccount, 'configuration')

  // 2. get configuration

  const configurationResponse = await ctx.call('data.igAccount.configuration.get', { igAccount: { igAccountId } })
  if (configurationResponse.code !== 200) { throw new MoleculerInternalError('error getting configuration') }
  const configuration = configurationResponse.data[configurationResponse.type]

  // 3. check configuration

  const neededAudience = () => ['all', 'audience'].includes(configuration.sources.attack)

  if (neededAudience()) {
    // audience sources
    if (_.isEmpty(configuration.audience.locations) &&
    _.isEmpty(configuration.audience.accounts) &&
    _.isEmpty(configuration.audience.hashtags)) {
      throw new MoleculerConflictDataError('audience sources are empty', 'WRONG_CONFIGURATION', configuration)
    }

    // shuffle sources
    configuration.audience.locations = _.shuffle(configuration.audience.locations)
    configuration.audience.accounts = _.shuffle(configuration.audience.accounts)
    configuration.audience.hashtags = _.shuffle(configuration.audience.hashtags)

    // set used to false
    configuration.audience.locations.forEach(l => l.used = false)
    configuration.audience.accounts.forEach(a => a.used = false)
    configuration.audience.hashtags.forEach(h => h.used = false)
  }

  // country
  if (!iso3166.whereAlpha2(configuration.country)) {
    throw new MoleculerConflictDataError('country is not valid', 'WRONG_CONFIGURATION', configuration)
  }

  // speed
  if (![-1, 0, 1].includes(configuration.speed)) {
    throw new MoleculerConflictDataError('speed is not valid', 'WRONG_CONFIGURATION', configuration)
  }

  // sources
  if (!['all', 'feed', 'audience'].includes(configuration.sources.attack)) {
    throw new MoleculerConflictDataError('attack sources is not valid', 'WRONG_CONFIGURATION', configuration)
  }
  if (!['all', 'smartgram'].includes(configuration.sources.unattack)) {
    throw new MoleculerConflictDataError('unattack sources is not valid', 'WRONG_CONFIGURATION', configuration)
  }

  // filters media
  // 1 day - 4 months
  if (!_.inRange(configuration.filters.media.age, Duration.fromObject({ days: 1 }).as('milliseconds') - 1, Duration.fromObject({ months: 4 }).as('milliseconds') + 1)) {
    throw new MoleculerConflictDataError('media age is not valid', 'WRONG_CONFIGURATION', configuration)
  }

  // filters attack
  // 1 day - 4 months
  if (!_.inRange(configuration.filters.attack.timeBetweenAttacksSameAccount, Duration.fromObject({ days: 1 }).as('milliseconds') - 1, Duration.fromObject({ months: 4 }).as('milliseconds') + 1)) {
    throw new MoleculerConflictDataError('attack timeBetweenAttacksSameAccount is not valid', 'WRONG_CONFIGURATION', configuration)
  }
  if (!_.isBoolean(configuration.filters.attack.privateAccounts)) {
    throw new MoleculerConflictDataError('attack privateAccounts is not valid', 'WRONG_CONFIGURATION', configuration)
  }
  if (!_.isBoolean(configuration.filters.attack.businessAccounts)) {
    throw new MoleculerConflictDataError('attack businessAccounts is not valid', 'WRONG_CONFIGURATION', configuration)
  }
  if (!_.isBoolean(configuration.filters.attack.notFollowers)) {
    throw new MoleculerConflictDataError('attack notFollowers is not valid', 'WRONG_CONFIGURATION', configuration)
  }
  if (!_.isBoolean(configuration.filters.attack.moreThanOnce)) {
    throw new MoleculerConflictDataError('attack moreThanOnce is not valid', 'WRONG_CONFIGURATION', configuration)
  }

  // filters blacklist
  if (!_.isArray(configuration.filters.attack.blacklist)) {
    throw new MoleculerConflictDataError('attack blacklist is not valid', 'WRONG_CONFIGURATION', configuration)
  }
  configuration.filters.attack.blacklist.forEach((a) => {
    if (!_.isString(a.igId) || _.isEmpty(a.igId)) {
      throw new MoleculerConflictDataError(`attack blacklist is not valid, a: ${a}`, 'WRONG_CONFIGURATION', configuration)
    }
  })

  // filters unattack
  if (!_.isBoolean(configuration.filters.unattack.whoDontFollowMe)) {
    throw new MoleculerConflictDataError('unattack whoDontFollowMe is not valid', 'WRONG_CONFIGURATION', configuration)
  }

  // 4. adapt configuration cycle sizes

  // parse to int
  configuration.cycleSize.attack = parseInt(configuration.cycleSize.attack, 10)
  configuration.cycleSize.unattack = parseInt(configuration.cycleSize.unattack, 10)

  // round to hundreds
  configuration.cycleSize.attack = Math.round(configuration.cycleSize.attack / 100) * 100
  configuration.cycleSize.unattack = Math.round(configuration.cycleSize.unattack / 100) * 100

  // lowest value
  if (configuration.cycleSize.attack < 100) {
    configuration.cycleSize.attack = 100
  }

  // lowest value
  if (configuration.cycleSize.unattack < 100) {
    configuration.cycleSize.unattack = 100
  }

  // 5. make calculate configuration attributes

  configuration.calculated = {}

  // attacks & unattacks in row
  // attacksInRow
  // unattacksInRow
  if (configuration.cycleSize.attack > configuration.cycleSize.unattack) {
    const fraction = reduceFraction(configuration.cycleSize.attack, configuration.cycleSize.unattack)
    configuration.calculated.attacksInRow = fraction[0]
    configuration.calculated.unattacksInRow = fraction[1]
  } else {
    const fraction = reduceFraction(configuration.cycleSize.unattack, configuration.cycleSize.attack)
    configuration.calculated.attacksInRow = fraction[1]
    configuration.calculated.unattacksInRow = fraction[0]
  }

  // 6. save configuration

  await InstagramAccount.collection.findOneAndUpdate({ igAccountId }, { $set: { 'cycle.configuration': configuration } })

  // 7. set ready to init state

  await InstagramAccount
    .collection
    .findOneAndUpdate({
      igAccountId,
    }, {
      $set: {
        'cycle.ready.attack.accounts': [],
        'cycle.ready.attack.medias': [],
        'cycle.ready.unattack.accounts': [],
      },
    }, {
      upsert: false,
    })

  // 8. set counters to init state

  await InstagramAccount
    .findOneAndUpdate({
      igAccountId,
    }, {
      $set: {
        'cycle.counters.attacksTotal': 0,
        'cycle.counters.unattacksTotal': 0,
        'cycle.counters.attacksOnStep': 0,
        'cycle.counters.unattacksOnStep': 0,
        'cycle.counters.lastAudienceSource': '',
      },
    }).exec()

  // 9. init configuration decisions

  await InstagramAccount
    .findOneAndUpdate({
      igAccountId,
    }, {
      $set: {
        'cycle.decisions.attackSource': {
          epsilon: 0.3,
          arms: [{
            name: 'switchAudience',
            value: 0,
            count: 0,
          }, {
            name: 'searchFeed',
            value: 0,
            count: 0,
          }],
        },
      },
    }).exec()

  // 11. update started iteration at
  await InstagramAccount
    .findOneAndUpdate({
      igAccountId,
    }, {
      $set: {
        'cycle.startedAt': DateTime.utc().toJSDate(),
      },
    }).exec()

  // 10. next state

  await action.forwardState(igAccount, 'controlFollowers', false)
  return new OkResponse()
}

module.exports = action

// Reduce a fraction by finding the Greatest Common Divisor and dividing by it.
function reduceFraction(numerator, denominator) {
  let gcd = function gcd(a, b) {
    return b ? gcd(b, a % b) : a
  }

  gcd = gcd(numerator, denominator)
  return [numerator / gcd, denominator / gcd]
}

